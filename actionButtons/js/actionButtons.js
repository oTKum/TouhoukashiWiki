$( function() {
    'use strict';

    const $container = $( '#container' );
    const l = location;
    const pageid = l.href.replace( /^.+?(\d+\.html)$/, '$1' );
    let $menu, $menuNew, $menuNewActions, $input;

    const msg = {
        create: {
            new: 'ページを作成',
            newDesc: '(Ctrl+クリックで通常作成)',
            circle: 'サークルページを作成',
            album: 'アルバムページを作成',
            music: '曲ページを作成'
        },
        edit: 'このページを編集',
        url: {
            new: '/touhoukashi/new',
            edit: '/touhoukashi/pedit/' + pageid,
        },
        placeholder: {
            new: 'ページ名を入力',
            circle: 'サークル名を入力',
            album: 'アルバム名を入力',
            music: '曲名を入力'
        },
        error: {
            blank: 'ページ名を入力してください',
            unmatch: '以下の形式で入力してください<br>"(半角数字2字)(半角空白1字)(曲名)"<br>例："01 Music"'
        }
    };

    const cls = {
        activeNew: 'ab-active__new',
        activeNewActions: 'ab-active__newActions',
        error: 'ab-error',
        errorText: 'ab-error__text'
    };

    const template = {
        circle: [ 1250, 'テンプレ＞サークル' ],
        album: [ 1249, 'テンプレ＞アルバム' ],
        music: [ 1248, 'テンプレ＞曲' ]
    };

    const faCss = '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.5.0/css/solid.css" integrity="sha384-rdyFrfAIC05c5ph7BKz3l5NG5yEottvO/DQ0dCrwD8gzeQDjYBHNr1ucUpQuljos" crossorigin="anonymous">'
    + '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.5.0/css/fontawesome.css" integrity="sha384-u5J7JghGz0qUrmEsWzBQkfvc8nK3fUT7DCaQzNQ+q4oEXhGSx+P2OqjWsfIRB8QT" crossorigin="anonymous">';

    let html = '<div id="ab-menu">'
        + '<ul id="ab-create">'
        + '<li id="ab-create__album">'
        + '<i class="fas fa-fw fa-lg fa-compact-disc"></i>'
        + '<span class="ab-menu__tooltip">' + msg.create.album + '</span>'
        + '<form method="POST">'
        + '<input type="text" name="album" placeholder="' + msg.placeholder.album + '">'
        + '</form>'
        + '</li>'
        + '<li id="ab-create__circle">'
        + '<i class="fas fa-fw fa-lg fa-users"></i>'
        + '<span class="ab-menu__tooltip">' + msg.create.circle + '</span>'
        + '<form method="POST">'
        + '<input type="text" name="circle" placeholder="' + msg.placeholder.circle + '">'
        + '</form>'
        + '</li>'
        + '<li id="ab-create__music">'
        + '<i class="fas fa-fw fa-lg fa-music"></i>'
        + '<span class="ab-menu__tooltip">' + msg.create.music + '</span>'
        + '<form method="POST">'
        + '<input type="text" name="music" placeholder="' + msg.placeholder.music + '">'
        + '</form>'
        + '</li>'
        + '<li id="ab-create__new">'
        + '<form target="_blank" name="new" action="' + msg.url.new + '" method="POST">'
        + '<input id="ab-create__newPage" type="submit"></input>'
        + '</form>'
        + '<i class="fas fa-fw fa-lg fa-plus"></i>'
        + '<span class="ab-menu__tooltip">' + msg.create.new + '<br><span class="ab-menu__small">' + msg.create.newDesc + '</span></span>'
        + '<form method="POST">'
        + '<input type="text" name="new" placeholder="' + msg.placeholder.new + '">'
        + '</form>'
        + '</li>'
        + '</ul>'
        + '<ul id="ab-edit">'
        + '<li id="ab-edit__edit">'
        + '<a href="' + msg.url.edit + '">'
        + '<i class="fas fa-fw fa-lg fa-pen"></i>'
        + '<span class="ab-menu__tooltip">' + msg.edit + '</span>'
        + '</a>'
        + '</li>'
        + '</ul>'
        + '</div>';

    function genNewPageLink( page, fromPagename ) {
        page = encodeURIComponent(page);

        return `/touhoukashi/?cmd=pedit&page=${page}&frompagename=${fromPagename}`;
    }

    $( 'head' ).find( 'link' ).first().before( faCss );
    $container.append( html );

    $menu = $( '#ab-create' );
    $menuNew = $( '#ab-create__new' );
    $menuNewActions = $menu.find( 'li' ).not( $menuNew );
    $input = $menu.find( 'input[type="text"]' );

    // ページ作成ボタン
    $menuNew.on( 'click', function( e ) {
        const $this = $( this );

        if ( e.target.nodeName === 'INPUT' ) return;
        // Ctrl + クリックで通常新規作成
        if ( e.ctrlKey ) {
            const $activeNewActions = $menu.find( '.ab-active__newActions' );
            if ( $menu.hasClass( cls.activeNew ) ) {
                $menu.toggleClass( cls.activeNew );
            }
            // 	特定ページ作成ボタンで入力欄展開中にCtrl + クリック時、その入力欄を閉じこちらを開く
            if ( $activeNewActions.not( $this ).length ) {
                $activeNewActions.toggleClass( cls.activeNewActions );
            }
            $this.toggleClass( cls.activeNewActions );
            // $( '#ab-create__newPage' ).click();
            return;
        }
        if ( $this.hasClass( cls.activeNewActions ) ) {
            $this.toggleClass( cls.activeNewActions );
            return;
        }
        // 入力欄展開中に閉じるボタンをクリックした際、入力欄のみを閉じる
        if ( $( '.ab-active__new' ).length && $( '.ab-active__newActions' ).length ) {
            $( '.ab-active__newActions' ).toggleClass( cls.activeNewActions );
            return;
        }
        $menu.toggleClass( cls.activeNew );
    } );

    // 特定ページ作成ボタン
    $menuNewActions.on( 'click', function( e ) {
        if ( e.target.nodeName === 'INPUT' ) return;
        $( this ).toggleClass( cls.activeNewActions );
    } );

    // 入力欄展開時にフォーカス
    $menu.find( 'li' ).on( 'click', function() {
        const $input = $( this ).find( 'input' );
        if ( $( this ).hasClass( cls.activeNewActions ) ) {
            // visibility 待機のため遅延後実行
            $input.delay( 300 ).queue( function() {
                $( this ).focus().dequeue();
            } );
        }
    } );

    // 入力送信時のチェックおよび作成ページへの移行
    $input.on( 'keydown', function( e ) {
        function genErrorHtml( text, isForHtml ) {
            return ( isForHtml )
                ? '<span class="ab-error__text"><i class="fas fa-exclamation-circle"></i> ' + text + '</span>'
                : '<i class="fas fa-exclamation-circle"></i> ' + text;
        }

        // Esc キー押下で入力欄を閉じる
        if ( e.keyCode === 27 ) {
            $( this ).closest( 'li' ).toggleClass( cls.activeNewActions ); // TODO: なぜtoggle？removeClassにできないか要調査
        }

        // Enter 押下時にエラーチェック・ページ移行
        if ( e.keyCode === 13 ) {
            const $this = $( this );
            const $parent = $this.parent();
            const $thisErrorText = $this.next( '.ab-error__text' );
            const $newLinkForm = $menu.find( 'form[name="new"]' );
            const thisVal = $this.val();
            const inputName = $this.attr( 'name' );

            if ( !thisVal || /^\s+$/.test( thisVal ) ) {
                // 空欄・空白のみ
                if ( $this.hasClass( cls.error ) ) {
                    $thisErrorText.html( genErrorHtml( msg.error.blank ) );
                } else {
                    $this.addClass( cls.error );
                    $parent.append( genErrorHtml( msg.error.blank, true ) );
                }
            } else if ( !/^\d{2} \S+/.test( thisVal ) && inputName === 'music' ) {
                // 曲ページ名の誤形式
                if ( $this.hasClass( cls.error ) ) {
                    $thisErrorText.html( genErrorHtml( msg.error.unmatch ) );
                } else {
                    $this.addClass( cls.error );
                    $parent.append( genErrorHtml( msg.error.unmatch, true ) );
                }
            } else if ( $this.closest( 'li' ).attr( 'id' ) === 'ab-create__new' ) {
                // 新規作成のページ移行
                const link = '/touhoukashi/?cmd=pedit&page=' + thisVal;
                $newLinkForm.attr( 'action', link ).find( 'input' ).click();
            } else {
                // 特定ページの移行
                const link = genNewPageLink( thisVal, template[ inputName ][ 1 ] );
                $newLinkForm.attr( 'action', link ).find( 'input' ).click();
            }
            return false;
        }
    } );

    // 未作成ページに来た際、そのページ名を自動補完
    if ( /^\?page=.+/.test( l.search ) ) {
        const page = decodeURI( l.search.split( '=' )[ 1 ] );
        if ( /^\d{2} .+/.test( page ) ) {
            $input.filter( '[name="music"]' ).val( page );
        } else {
            $input.filter( '[name!="music"]' ).val( page );
        }
    }
} );
