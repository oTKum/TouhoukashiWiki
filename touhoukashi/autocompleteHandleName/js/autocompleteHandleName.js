$( function() {
    'use strict';

    // comment_num2プラグインによるフォーム
    const $form = $( '.plugin_comment_num2_form' );
    // ナビバー右上のボタン郡。lengthが3未満なら未ログイン
    const $navItems = $( '#globalNavRight' ).find( '.normal' );
    // 補完するinput, アカウント名, ローカルストレージの保存値
    let $targetInput, handleName, acHandleName, acHandleNameCustom, acHandleNameCustomName;

    if ( !$form.length ) return;

    $targetInput = $form.find( 'input[name="name"]' );
    acHandleName = localStorage.getItem( 'PoteJS_autocompleteHandleName' );
    acHandleName = ( acHandleName === null ) ? 1 : acHandleName === 'true';
    acHandleNameCustom = localStorage.getItem( 'PoteJS_autocompleteHandleName-custom' );
    acHandleNameCustom = acHandleNameCustom === 'true';
    acHandleNameCustomName = localStorage.getItem( 'PoteJS_autocompleteHandleName-customName' );
    handleName = ( acHandleNameCustom ) ? acHandleNameCustomName : '';
    const isLogined = $( '.atwiki-login-status' ).length !== -1; // ログインしてるかどうか

    // 設定UI
    const html = '<li class="acHandleName-config">'
        + '<div class="acHandleName-configButton">設定</div>'
        + '<div class="acHandleName-configItem">'
        + '<div class="acHandleName-configItem__autocomplete">'
        + '<label>'
        + '<input type="checkbox" class="inputAutocompleteHandleName"'
        + ( acHandleName ? 'checked' : '' ) + '>'
        + 'コメントフォームの名前を自動補完する'
        + '</label>'
        + '</div>'
        + '<div class="acHandleName-configItem__custom">'
        + '<label>'
        + '<input type="checkbox" class="inputAutocompleteHandleName-custom"'
        + ( acHandleNameCustom ? 'checked' : '' )
        + ' onClick="toggleDisabled( this.checked );">'
        + '補完する名前を指定する'
        + '<br>'
        + '<input type="text" class="inputAutocompleteHandleName-customName" placeholder="補完する名前"'
        + ( acHandleNameCustomName ? 'value="' + acHandleNameCustomName + '"' : '' )
        + ( acHandleNameCustom ? '' : 'disabled' ) + '>'
        + '</label>'
        + '</div>'
        + '<div class="acHandleName-configSave">'
        + '保存'
        + '</div>'
        + '<div class="acHandleName-configSavedMessage">'
        + '保存しました'
        + '</div></div></li>';
    let $acHandleName;

    $( '.at_header_search_box' ).after( html );
    $acHandleName = $( '.acHandleName-config' );

    // 設定表示切り替え
    $acHandleName.find( '.acHandleName-configButton' ).on( 'click', function() {
        $acHandleName.toggleClass( 'acHandleName-active' );
    } );

    // 設定保存
    $acHandleName.find( '.acHandleName-configSave' ).on( 'click', function() {
        const acIsChecked = $acHandleName.find( '.inputAutocompleteHandleName' ).prop( 'checked' );
        const acCustomIsChecked = $acHandleName.find( '.inputAutocompleteHandleName-custom' ).prop( 'checked' );
        localStorage.setItem( 'PoteJS_autocompleteHandleName', acIsChecked );
        localStorage.setItem( 'PoteJS_autocompleteHandleName-custom', acCustomIsChecked );
        if ( acCustomIsChecked ) {
            const acCustomName = $acHandleName.find( '.inputAutocompleteHandleName-customName' ).val();
            localStorage.setItem( 'PoteJS_autocompleteHandleName-customName', acCustomName );
        }

        $acHandleName.find( '.acHandleName-configSavedMessage' ).slideToggle( 500 );
        setTimeout( function() {
            $acHandleName.find( '.acHandleName-configSavedMessage' ).slideToggle( 500 );
        }, 3000 );
    } );

    if ( acHandleName === 1 ) {
        localStorage.setItem( 'PoteJS_autocompleteHandleName', true );
    }

    // 未ログインでハンネなしなら弾く
    if ( !isLogined && !acHandleNameCustom ) return;

    // 自動補完
    if ( acHandleName ) $targetInput.val( handleName );
} );

function toggleDisabled( isChecked ) {
    if ( isChecked ) {
        $( '.inputAutocompleteHandleName-customName' ).prop( 'disabled', false );
    } else {
        $( '.inputAutocompleteHandleName-customName' ).prop( 'disabled', true );
    }
}