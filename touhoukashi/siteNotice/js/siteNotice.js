$( function() {
    // 表示させるお知らせ
    // 複数表示させる場合は、この配列にメッセージを追加していく
    const messages = [
        {
            id: 0,
            content: 'このウィキで動作する一部の機能はInternet Explorerをサポートしなくなりました。該当する場合は、他のブラウザへの乗り換えをご検討ください（Google Chrome推奨）。'
        },
        {
            id: 1,
            content: 'test'
        }

        // 以下テンプレ
        // {
        //     id: n,        （上記と被らない半角数字を指定。最後のカンマは必須。個別で表示条件等を加える場合（詳細は下へ）に使用するが、そうでない場合も要指定。）
        //     content: text （示させるメッセージをここに。こちらはシングルクォートで囲む必要あり。HTMLタグ使用可。）
        // },
    ];

    const $html = $( [
        '<div id="site_notice">',
            '<span id="site_notice_header">お知らせ</span>',
            '<div id="site_notice_content"></div>',
        '</div>'
     ].join() );

    const ua     = window.navigator.userAgent.toLowerCase();
    let   showed = 0;

    for ( const msg of messages ) {
        // ID別の表示条件（任意）
        switch ( msg.id ) {
            // IE以外では表示しない
            case 0:
                if ( ua.indexOf( 'msie' ) === -1 &&
                     ua.indexOf( 'trident' ) === -1 ) {
                    continue;
                }
                break;

            // 以下テンプレ
            // case n: （↑で指定したIDをここに。）
            //     (条件)
            //     break;

            default:
                break;
        }

        $html.find( '#site_notice_content' ).append( `
            ${ $html.find( '.site_notice_entry' ).length ? '<hr>' : '' }
            <div class="site_notice_entry">
                ${ msg.content }
            </div>
        ` );

        showed++;
    }

    // 挿入先
    const $mobile = $( '.sp-breadarumb' );
    const $pc     = $( '#header' );

    // 挿入
    // 表示可能なものがなければ挿入しない
    if ( showed > 0 ) {
        if ( $mobile.length ) {
            $mobile.after( $html );
        } else {
            $pc.after( $html );
        }
    }
} );
