// Tour Booking System
const WHATSAPP_NUMBER = '50671318813';

// Tour data with IDs and descriptions
const tours = {
  'monteverde-cloud-forest': {
    name: 'Monteverde Cloud Forest in Selvatura Park',
    description: 'Tirolesa, puentes colgantes y caminata guiada en bosque nuboso'
  },
  'vista-los-suenos': {
    name: 'Parque de Aventura Vista los Sueños',
    description: 'Cuatrimoto, canopy, bicicleta o surf con rutas llenas de emoción'
  },
  'rincon-vieja': {
    name: 'Rincón de la Vieja + Catarata Oropéndola',
    description: 'Senderismo moderado con fumarolas, lodo volcánico y catarata'
  },
  'arenal-tabacan': {
    name: 'Arenal Volcano + Tabacón Resort Full Day',
    description: 'Caminata volcánica y relajación en aguas termales premium'
  },
  'three-days-circuit': {
    name: '3 Days Arenal, Tabacón, Monteverde, Manuel Antonio',
    description: 'Ruta compacta combinando aventura, bosque nuboso y costa'
  },
  'isla-tortuga': {
    name: 'Isla Tortuga en Catamarán',
    description: 'Navegación premium con snorkel en aguas turquesas'
  },
  'masaya-granada-3days': {
    name: 'Masaya Granada Nicaragua 3 Days',
    description: 'Volcán activo, miradores y recorrido lacustre'
  },
  'masaya-granada-1day': {
    name: 'Masaya Granada Nicaragua Tour de un Día',
    description: 'Mercado artesanal, volcán activo y ciudad colonial'
  }
};

let currentTourId = null;

function parseTourPrices() {
  const cards = document.querySelectorAll('.prices-grid .price-card');
  const prices = { adult: null, child: null, family: null, groups: [] };

  cards.forEach((card) => {
    const category = card.querySelector('.price-category')?.textContent.trim() || '';
    const amountText = card.querySelector('.price-amount')?.textContent || '';
    const amount = Number(amountText.replace(/[^0-9.]/g, ''));
    const categoryLower = category.toLowerCase();
    const range = category.match(/(\d+)\s*(?:-|a|\+)\s*(\d+)?/i);
    const isPerGroup = (card.querySelector('.price-desc')?.textContent || '').toLowerCase().includes('grupo');

    if (!amount) return;
    if (categoryLower.includes('niño') || categoryLower.includes('nino') || categoryLower.includes('child')) {
      prices.child = amount;
      return;
    }
    if (categoryLower.includes('adult') || categoryLower.includes('adulto')) {
      prices.adult = amount;
      return;
    }
    if (categoryLower.includes('famil')) {
      prices.family = amount;
      return;
    }
    if (range || categoryLower.includes('grupo') || categoryLower.includes('people') || categoryLower.includes('personas')) {
      const minimum = range ? Number(range[1]) : 1;
      const maximum = range && range[2] ? Number(range[2]) : Infinity;
      prices.groups.push({ minimum, maximum, amount, isPerGroup });
    }
  });

  prices.groups.sort((first, second) => first.minimum - second.minimum);
  return prices;
}

function getBookingParticipants() {
  const adults = Math.max(0, parseInt(document.getElementById('bookingAdults')?.value || '0', 10));
  const children = Math.max(0, parseInt(document.getElementById('bookingChildren')?.value || '0', 10));
  const legacyPeople = Math.max(1, parseInt(document.getElementById('bookingPeople')?.value || '1', 10));

  if (!document.getElementById('bookingAdults')) {
    return { adults: legacyPeople, children: 0, total: legacyPeople };
  }

  return { adults, children, total: adults + children };
}

function calculateBookingPrice(participants, prices) {
  if (participants.children > 0 && prices.family) {
    return {
      total: participants.total * prices.family,
      label: `Tarifa familiar (${prices.family} por persona)`
    };
  }

  const groupPrice = prices.groups.find((group) => participants.total >= group.minimum && participants.total <= group.maximum);
  if (groupPrice) {
    return {
      total: groupPrice.isPerGroup ? groupPrice.amount : participants.total * groupPrice.amount,
      label: groupPrice.isPerGroup ? 'Precio del grupo' : `Grupo (${groupPrice.amount} por persona)`
    };
  }

  const adultPrice = prices.adult || prices.child || 0;
  const childPrice = prices.child || adultPrice;
  return {
    total: participants.adults * adultPrice + participants.children * childPrice,
    label: `${participants.adults} adulto(s)${participants.children ? ` + ${participants.children} niño(s)` : ''}`
  };
}

function initializeParticipantFields() {
  const peopleInput = document.getElementById('bookingPeople');
  if (!peopleInput || document.getElementById('bookingAdults')) return;

  const group = peopleInput.closest('.form-group');
  const supportsChildren = parseTourPrices().child !== null;
  const childrenField = supportsChildren ? `
    <label for="bookingChildren">Niños:</label>
    <div class="input-spinner">
      <button type="button" onclick="decrementParticipant('bookingChildren')">−</button>
      <input type="number" id="bookingChildren" name="children" value="0" min="0" max="20" readonly />
      <button type="button" onclick="incrementParticipant('bookingChildren')">+</button>
    </div>` : '';

  group.innerHTML = `
    <label for="bookingAdults">Adultos:</label>
    <div class="input-spinner">
      <button type="button" onclick="decrementParticipant('bookingAdults')">−</button>
      <input type="number" id="bookingAdults" name="adults" value="1" min="0" max="20" readonly />
      <button type="button" onclick="incrementParticipant('bookingAdults')">+</button>
    </div>
    ${childrenField}
    <input type="hidden" id="bookingPeople" name="people" value="1" />`;

  const summaryPrice = document.getElementById('summaryPrice');
  if (summaryPrice && !document.getElementById('summaryBreakdown')) {
    const summaryItem = document.createElement('div');
    summaryItem.className = 'summary-item';
    summaryItem.innerHTML = '<span>Desglose:</span><strong id="summaryBreakdown">-</strong>';
    summaryPrice.closest('.summary-item').after(summaryItem);
  }
}

function incrementParticipant(id) {
  const input = document.getElementById(id);
  const participants = getBookingParticipants();
  if (input && participants.total < 20) {
    input.value = Number(input.value) + 1;
    updateBookingSummary();
  }
}

function decrementParticipant(id) {
  const input = document.getElementById(id);
  if (!input) return;
  const minimum = id === 'bookingAdults' ? 1 : 0;
  if (Number(input.value) > minimum) {
    input.value = Number(input.value) - 1;
    updateBookingSummary();
  }
}

/**
 * Open tour detail modal
 */
function openTourDetail(tourId, tourName) {
  currentTourId = tourId;
  const modal = document.getElementById('bookingModal');
  const tourData = tours[tourId];

  if (!tourData) {
    console.warn('Tour not found:', tourId);
    return;
  }

  // Set tour information
  document.getElementById('tourTitle').textContent = tourData.name;
  document.getElementById('tourDescription').textContent = tourData.description;
  document.getElementById('summaryTour').textContent = tourData.name;

  // Reset form
  resetBookingForm();

  // Set minimum date to today
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];
  document.getElementById('bookingDate').min = minDate;
  document.getElementById('bookingDate').value = minDate;

  // Show modal
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Update summary
  updateBookingSummary();
}

/**
 * Close tour detail modal
 */
function closeTourDetail() {
  const modal = document.getElementById('bookingModal');
  modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
  currentTourId = null;
}

/**
 * Reset booking form
 */
function resetBookingForm() {
  document.getElementById('bookingForm').reset();
  const adults = document.getElementById('bookingAdults');
  const children = document.getElementById('bookingChildren');
  if (adults) adults.value = '1';
  if (children) children.value = '0';
  document.getElementById('bookingPeople').value = '1';
  document.getElementById('bookingDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('bookingTime').value = '';
  document.getElementById('bookingName').value = '';
  document.getElementById('bookingPhone').value = '';
  document.getElementById('bookingEmail').value = '';
}

/**
 * Increment people counter
 */
function incrementPeople() {
  if (document.getElementById('bookingAdults')) {
    incrementParticipant('bookingAdults');
    return;
  }
  const input = document.getElementById('bookingPeople');
  const current = parseInt(input.value, 10);
  if (current < 20) {
    input.value = current + 1;
    updateBookingSummary();
  }
}

/**
 * Decrement people counter
 */
function decrementPeople() {
  if (document.getElementById('bookingAdults')) {
    decrementParticipant('bookingAdults');
    return;
  }
  const input = document.getElementById('bookingPeople');
  const current = parseInt(input.value, 10);
  if (current > 1) {
    input.value = current - 1;
    updateBookingSummary();
  }
}

/**
 * Update booking summary display
 */
function updateBookingSummary() {
  const date = document.getElementById('bookingDate').value;
  const time = document.getElementById('bookingTime').value;
  const participants = getBookingParticipants();
  const prices = parseTourPrices();
  const bookingPrice = calculateBookingPrice(participants, prices);
  document.getElementById('bookingPeople').value = participants.total;

  // Format date
  if (date) {
    const dateObj = new Date(date + 'T00:00:00');
    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    document.getElementById('summaryDate').textContent = formatter.format(dateObj);
  } else {
    document.getElementById('summaryDate').textContent = '-';
  }

  // Format time
  if (time) {
    document.getElementById('summaryTime').textContent = time;
  } else {
    document.getElementById('summaryTime').textContent = '-';
  }

  // Update people
  document.getElementById('summaryPeople').textContent = participants.total;
  document.getElementById('summaryPrice').textContent = '$' + bookingPrice.total.toLocaleString('en-US');
  const summaryBreakdown = document.getElementById('summaryBreakdown');
  if (summaryBreakdown) summaryBreakdown.textContent = bookingPrice.label;
}

/**
 * Reserve on WhatsApp
 */
function reserveOnWhatsApp() {
  // Get form values
  const date = document.getElementById('bookingDate').value;
  const time = document.getElementById('bookingTime').value;
  const participants = getBookingParticipants();
  const people = participants.total;
  const bookingPrice = calculateBookingPrice(participants, parseTourPrices());
  const name = document.getElementById('bookingName').value;
  const phone = document.getElementById('bookingPhone').value;
  const email = document.getElementById('bookingEmail').value;

  // Validate form
  if (!date || !time || !name || !phone) {
    showNotification('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  const tourData = tours[currentTourId];
  const displayName = tourData ? tourData.name : (typeof tourName !== 'undefined' ? tourName : 'Tour');

  if (!tourData && typeof tourName === 'undefined') {
    showNotification('Error: Tour no encontrado', 'error');
    return;
  }

  // Format date
  const dateObj = new Date(date + 'T00:00:00');
  const formatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedDate = formatter.format(dateObj);

  // Build message
  const message = `Hola! Me gustaría hacer una reserva:

📍 *Tour:* ${displayName}
📅 *Fecha:* ${formattedDate}
🕐 *Hora:* ${time}
👥 *Personas:* ${people}
💵 *Precio estimado:* $${bookingPrice.total.toLocaleString('en-US')}
📋 *Desglose:* ${bookingPrice.label}

*Datos del solicitante:*
👤 *Nombre:* ${name}
📱 *Teléfono:* ${phone}
${email ? `📧 *Correo:* ${email}` : ''}

¿Podría confirmar disponibilidad? Gracias!`;

  // Encode message
  const encodedMessage = encodeURIComponent(message);

  // Open WhatsApp
  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
  window.open(whatsappURL, '_blank');

  // Close modal
  closeTourDetail();

  // Show success message
  showNotification('¡Redirigiendo a WhatsApp! Completa tu mensaje de reserva.', 'success');
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 2000;
    animation: slideIn 0.3s ease;
    max-width: 90%;
  `;

  // Add animation
  const style = document.createElement('style');
  if (!document.querySelector('style[data-notification]')) {
    style.setAttribute('data-notification', 'true');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

/**
 * Update summary when form values change
 */
document.addEventListener('DOMContentLoaded', () => {
  initializeParticipantFields();
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('change', updateBookingSummary);
  }

  // Close modal on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTourDetail();
    }
  });

  // Close modal on outside click
  const modalOverlay = document.getElementById('bookingModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeTourDetail();
      }
    });
  }
});
