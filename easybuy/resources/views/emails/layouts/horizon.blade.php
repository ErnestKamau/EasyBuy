{{--
  Jade Horizon — global transactional email shell.
  Pass via @extends('emails.layouts.horizon', [...]):
    intent     success | delivery | security | warning | danger | info | brand
    eyebrow    small kicker above the heading
    heading    main title
    preheader  inbox preview text
--}}
@php
    $intent = $intent ?? 'brand';
    $tokens = [
        'bg'        => '#F7F9F7',
        'card'      => '#FFFFFF',
        'text'      => '#121A15',
        'muted'     => '#667A6C',
        'faint'     => '#8FA094',
        'border'    => '#DCE4DE',
        'jade'      => '#288760',
        'jadeDeep'  => '#1A5140',
        'jadeMid'   => '#5CA87C',
        'jadeSoft'  => '#E0F2E4',
        'jadePale'  => '#F2F9F4',
        'amber'     => '#D97706',
        'amberSoft' => '#FEF3C7',
        'red'       => '#DC2626',
        'redSoft'   => '#FEE2E2',
        'blue'      => '#2563EB',
        'blueSoft'  => '#DBEAFE',
        'white'     => '#FFFFFF',
    ];
    $palette = [
        'success'  => ['bar' => $tokens['jade'],     'orb' => $tokens['jadePale'],  'mark' => $tokens['jade'],     'soft' => $tokens['jadeSoft']],
        'delivery' => ['bar' => $tokens['jadeMid'],   'orb' => $tokens['jadePale'],  'mark' => $tokens['jadeDeep'], 'soft' => $tokens['jadeSoft']],
        'security' => ['bar' => $tokens['jadeDeep'],  'orb' => $tokens['jadeSoft'],  'mark' => $tokens['jadeDeep'], 'soft' => $tokens['jadePale']],
        'warning'  => ['bar' => $tokens['amber'],     'orb' => $tokens['amberSoft'], 'mark' => $tokens['amber'],    'soft' => $tokens['amberSoft']],
        'danger'   => ['bar' => $tokens['red'],       'orb' => $tokens['redSoft'],   'mark' => $tokens['red'],      'soft' => $tokens['redSoft']],
        'info'     => ['bar' => $tokens['blue'],      'orb' => $tokens['blueSoft'],  'mark' => $tokens['blue'],     'soft' => $tokens['blueSoft']],
        'brand'    => ['bar' => $tokens['jade'],      'orb' => $tokens['jadePale'],  'mark' => $tokens['jade'],     'soft' => $tokens['jadeSoft']],
    ];
    $p = $palette[$intent] ?? $palette['brand'];
    $marks = [
        'success'  => '✓',
        'delivery' => '→',
        'security' => '⌘',
        'warning'  => '!',
        'danger'   => '!',
        'info'     => '↺',
        'brand'    => '◆',
    ];
    $mark = $marks[$intent] ?? $marks['brand'];
    $appName = config('app.name', 'EasyBuy');
    $year = date('Y');
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{{ $heading ?? $appName }}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        @@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { margin: 0 !important; padding: 0 !important; width: 100% !important; background: {{ $tokens['bg'] }}; }
        a { color: {{ $tokens['jade'] }}; }
        .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all; }
        .hero-orb {
            animation: horizon-float 3.4s ease-in-out infinite;
        }
        .hero-ring {
            animation: horizon-pulse 2.8s ease-in-out infinite;
        }
        .accent-bar {
            background-size: 200% 100%;
            animation: horizon-shimmer 4.5s linear infinite;
        }
        @@keyframes horizon-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
        }
        @@keyframes horizon-pulse {
            0%, 100% { opacity: 0.35; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.08); }
        }
        @@keyframes horizon-shimmer {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }
        @@media only screen and (max-width: 620px) {
            .email-card { width: 100% !important; border-radius: 20px !important; }
            .email-pad { padding: 28px 22px !important; }
            .heading { font-size: 24px !important; line-height: 30px !important; }
        }
        @@media (prefers-reduced-motion: reduce) {
            .hero-orb, .hero-ring, .accent-bar { animation: none !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background-color:{{ $tokens['bg'] }};">
    <div class="preheader">{{ $preheader ?? '' }}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:{{ $tokens['bg'] }};">
        <tr>
            <td align="center" style="padding:32px 16px 48px;">
                <table role="presentation" class="email-card" cellpadding="0" cellspacing="0" border="0" width="560" style="width:560px;max-width:560px;background-color:{{ $tokens['card'] }};border-radius:28px;overflow:hidden;border:1px solid {{ $tokens['border'] }};">
                    <tr>
                        <td class="accent-bar" height="6" style="height:6px;line-height:6px;font-size:0;background:linear-gradient(90deg, {{ $p['bar'] }}, {{ $tokens['jadeMid'] }}, {{ $p['bar'] }});background-size:200% 100%;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td class="email-pad" style="padding:40px 40px 36px;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:{{ $tokens['text'] }};">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="font-family:'Manrope',-apple-system,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:{{ $tokens['jade'] }};padding-bottom:28px;">
                                        {{ $appName }}
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding:8px 0 28px;">
                                        <div class="hero-ring" style="display:inline-block;padding:10px;border-radius:999px;background:{{ $p['soft'] }};">
                                            <div class="hero-orb" style="width:72px;height:72px;border-radius:36px;background:{{ $p['orb'] }};border:1px solid {{ $p['bar'] }}22;text-align:center;line-height:72px;font-family:'Manrope',sans-serif;font-size:28px;font-weight:800;color:{{ $p['mark'] }};">
                                                {{ $mark }}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            @isset($eyebrow)
                                <p style="margin:0 0 8px;text-align:center;font-family:'Inter',sans-serif;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:{{ $p['bar'] }};">
                                    {{ $eyebrow }}
                                </p>
                            @endisset

                            @isset($heading)
                                <h1 class="heading" style="margin:0 0 16px;text-align:center;font-family:'Manrope',-apple-system,sans-serif;font-size:28px;line-height:34px;font-weight:800;color:{{ $tokens['text'] }};">
                                    {{ $heading }}
                                </h1>
                            @endisset

                            @yield('content')
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 40px 36px;font-family:'Inter',sans-serif;text-align:center;">
                            <p style="margin:0 0 6px;font-size:13px;color:{{ $tokens['muted'] }};">
                                Sent by {{ $appName }}
                            </p>
                            <p style="margin:0;font-size:12px;color:{{ $tokens['faint'] }};">
                                This is an automated message — please do not reply.<br>
                                &copy; {{ $year }} {{ $appName }}. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
