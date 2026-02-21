<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Location: index.html#contact');
  exit;
}

function clean_text($value) {
  $value = trim($value ?? '');
  $value = str_replace(["\r", "\n", "%0a", "%0d"], ' ', $value);
  return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$honeypot = trim($_POST['company'] ?? '');
if ($honeypot !== '') {
  header('Location: index.html?sent=ok#contact');
  exit;
}

$name = clean_text($_POST['name'] ?? '');
$phone = clean_text($_POST['phone'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$message = trim($_POST['message'] ?? '');

if ($name === '' || $phone === '' || $email === false || $message === '') {
  header('Location: index.html?sent=error#contact');
  exit;
}

$to = 'reservas@huskytourscr.com';
$subject = 'Nueva consulta Husky Tours';

$body = "Has recibido una nueva consulta desde huskytourscr.com\n\n";
$body .= "Nombre: {$name}\n";
$body .= "Teléfono: {$phone}\n";
$body .= "Correo: {$email}\n\n";
$body .= "Mensaje:\n{$message}\n";

$headers = [];
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: Husky Tours <no-reply@huskytourscr.com>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: PHP/' . phpversion();

$sent = mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));

if ($sent) {
  header('Location: index.html?sent=ok#contact');
  exit;
}

header('Location: index.html?sent=error#contact');
exit;
