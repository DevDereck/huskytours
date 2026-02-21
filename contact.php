<?php

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html#contact');
    exit;
}

function clean_text($value)
{
    $value = trim((string)$value);
    $value = str_replace(array("\r", "\n", "%0a", "%0d"), ' ', $value);
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

$honeypot = isset($_POST['company']) ? trim($_POST['company']) : '';
if ($honeypot !== '') {
    header('Location: index.html?sent=ok#contact');
    exit;
}

$name = clean_text(isset($_POST['name']) ? $_POST['name'] : '');
$phone = clean_text(isset($_POST['phone']) ? $_POST['phone'] : '');
$emailRaw = isset($_POST['email']) ? trim($_POST['email']) : '';
$email = filter_var($emailRaw, FILTER_VALIDATE_EMAIL);
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if ($name === '' || $phone === '' || $email === false || $message === '') {
    header('Location: index.html?sent=error#contact');
    exit;
}

$to = 'reservas@huskytourscr.com';
$subject = 'Nueva consulta Husky Tours';

$body = "Has recibido una nueva consulta desde huskytourscr.com\n\n";
$body .= "Nombre: " . $name . "\n";
$body .= "Teléfono: " . $phone . "\n";
$body .= "Correo: " . $email . "\n\n";
$body .= "Mensaje:\n" . $message . "\n";

$headers = array();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/plain; charset=UTF-8';
$headers[] = 'From: Husky Tours <no-reply@huskytourscr.com>';
$headers[] = 'Reply-To: ' . $email;
$headers[] = 'X-Mailer: PHP/' . phpversion();

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

function send_via_formsubmit($name, $phone, $email, $message)
{
    $endpoint = 'https://formsubmit.co/ajax/reservas@huskytourscr.com';

    $payload = array(
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'message' => $message,
        '_subject' => 'Nueva consulta Husky Tours',
        '_captcha' => 'false',
        '_template' => 'table'
    );

    if (function_exists('curl_init')) {
        $ch = curl_init($endpoint);
        if ($ch) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($payload));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 20);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array('Accept: application/json'));
            $response = curl_exec($ch);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($response !== false && $curlError === '') {
                $json = json_decode($response, true);
                if (is_array($json) && isset($json['success']) && $json['success'] === 'true') {
                    return true;
                }
                if (is_array($json) && isset($json['success']) && $json['success'] === true) {
                    return true;
                }
            }
        }
    }

    if (ini_get('allow_url_fopen')) {
        $options = array(
            'http' => array(
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\nAccept: application/json\r\n",
                'content' => http_build_query($payload),
                'timeout' => 20
            )
        );

        $context = stream_context_create($options);
        $response = @file_get_contents($endpoint, false, $context);
        if ($response !== false) {
            $json = json_decode($response, true);
            if (is_array($json) && isset($json['success']) && ($json['success'] === true || $json['success'] === 'true')) {
                return true;
            }
        }
    }

    return false;
}

if (function_exists('mail')) {
    $sent = @mail($to, $encodedSubject, $body, implode("\r\n", $headers));
    if ($sent) {
        header('Location: index.html?sent=ok#contact');
        exit;
    }
}

$fallbackSent = send_via_formsubmit($name, $phone, $email, $message);
if ($fallbackSent) {
    header('Location: index.html?sent=ok#contact');
    exit;
}

header('Location: index.html?sent=error#contact');
exit;
