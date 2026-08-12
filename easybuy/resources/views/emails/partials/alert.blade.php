{{-- $tone: success|warning|danger|info   $title   $body --}}
@php
    $tones = [
        'success' => ['bg' => '#F2F9F4', 'border' => '#B7E5BA', 'title' => '#1A5140', 'body' => '#227352'],
        'warning' => ['bg' => '#FFFBEB', 'border' => '#FDE68A', 'title' => '#92400E', 'body' => '#B45309'],
        'danger'  => ['bg' => '#FEF2F2', 'border' => '#FECACA', 'title' => '#991B1B', 'body' => '#B91C1C'],
        'info'    => ['bg' => '#EFF6FF', 'border' => '#BFDBFE', 'title' => '#1E40AF', 'body' => '#1D4ED8'],
    ];
    $t = $tones[$tone ?? 'info'] ?? $tones['info'];
@endphp
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background-color:{{ $t['bg'] }};border:1px solid {{ $t['border'] }};border-radius:16px;">
    <tr>
        <td style="padding:16px 18px;">
            @isset($title)
                <p style="margin:0 0 4px;font-family:'Manrope',sans-serif;font-size:14px;font-weight:700;color:{{ $t['title'] }};">
                    {{ $title }}
                </p>
            @endisset
            <p style="margin:0;font-family:'Inter',sans-serif;font-size:13px;line-height:20px;color:{{ $t['body'] }};">
                {!! $body !!}
            </p>
        </td>
    </tr>
</table>
