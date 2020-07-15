/* What Are Name of Translation for This */

$( function() {
	'use strict';
	var action = mw.config.get( 'wgAction' );
	if ( action !== 'edit' ) return;

	var $editform = $( '#editform' );
	var $transBtn, $wantt;
	var clsActive = 'wantt-active';
	var autolinkObj = [];
	var reverselinkObj = [];
	var JSONReqList = [];

	var observer = new MutationObserver( function(rec) {
		for ( var i in rec ) {
			var added = rec[ i ].addedNodes[ 0 ] || null;
			if ( !added ) continue;
			$( added )
				.find( '#wikiEditor-section-advanced .group-insert' )
				.after( html );
			init();
		}
	} );

	var i18n = {
		text: {
			translateLabel: '項目名',
			insTranslation: '挿入',
			closePanel: '閉じる',
		},
		placeholder: {
			translate: '翻訳する項目名を入力'
		},
		title: {
			translateButton: '翻訳',
			insTranslation: 'データベースモジュールを参照し、入力した項目名の対訳を探します。\n対訳があれば、それを現在のカーソル位置に挿入します。'
		},
		error: {
			notRegistered: 'この項目の翻訳は未登録です'
		}
	};

	var modules = [
		'Module:Autolink/Block',
		'Module:Autolink/Exclusive',
		'Module:Autolink/Entity',
		'Module:Autolink/Item',
		'Module:Autolink/Other',
		'Module:Reverselink/Link'
	];

	var html = [
		'<div class="group group-translate">',
			'<span class="tool oo-ui-widget oo-ui-widget-enabled oo-ui-buttonElement-frameless oo-ui-iconElement oo-ui-buttonElement oo-ui-buttonWidget">',
				'<a class="oo-ui-buttonElement-button" roll="button" title="' + i18n.title.translateButton + '" tabindex="1" rel="nofollow">',
					'<span class="oo-ui-iconElement-icon oo-ui-icon-translate"></span>',
				'</a>',
			'</span>',
			'<div id="wantt-body">',
				'<div class="wantt-item-wrapper">',
					'<div class="wantt-item translate">',
						'<form action="javascript:void(0)">',
							'<label for="translate">',
								i18n.text.translateLabel,
							'</label>',
							'<input type="text" name="translate" placeholder="' + i18n.placeholder.translate + '" required disabled>',
							'<div class="wantt-actions">',
								'<button class="mw-ui-button mw-ui-progressive" name="insTranslation" ',
									'title="' + i18n.title.insTranslation + '">',
									i18n.text.insTranslation,
								'</button>',
								'<button class="mw-ui-button mw-ui-quite" type="button" name="closePanel">',
									i18n.text.closePanel,
								'</button>',
							'</div>',
						'</form>',
					'</div>',
					'<div class="wantt-item actions-area"></div>',
				'</div>',
				'<div class="wantt-error error"></div>',
			'</div>',
		'</div>'
	].join( '' );

var css = `
<style>
#wantt-body {
	visibility: hidden;
	opacity: 0;
	position: absolute;
	top: 70px;
	box-shadow: 0 0 7px;
	width: 200px;
	border: solid 2px #c8ccd1;
	border-radius: 3px;
	padding: 5px;
	background-color: rgba(234, 236, 240, .9);
	font-size: smaller;
	color: #222;
	user-select: none;
	transition: visibility .25s, opacity .25s;
	z-index: 999;
}
#wantt-body.wantt-active {
	visibility: visible;
	opacity: 1;
}
#wantt-body label {
	display: block;
	font-weight: bold;
}
#wantt-body input {
	width: calc(100% - 4px);
}
.wantt-item-wrapper {
	display: flex;
	position: relative;
	flex-flow: row wrap;
}
.wantt-item {
	flex: auto;
}
.wantt-item.actions-area {
	width: 100%;
	height: 28.5px;
	margin-top: .4em;
}
.wantt-actions {
	position: absolute;
	bottom: 0;
}
.wantt-actions button:not(:first-child) {
	margin-left: .5em;
}
.wantt-error {
	visibility: hidden;
	opacity: 0;
	position: absolute;
	top: -5px;
	right: 0;
	border-radius: 2px;
	padding: 1px 3px;
	background-color: rgba(34, 34, 34, .1);
	font-weight: bold;
	font-size: inherit;
	transition: visibility .75s, opacity .75s;
}
.wantt-error.wantt-active {
	visibility: visible;
	opacity: 1;
}
.oo-ui-icon-translate {
	background-image: url("https://gamepedia.cursecdn.com/minecraft_ja_gamepedia/1/14/Translate_button.svg");
}
</style>
`;

	// $toolbar.after( html );
	observer.observe( $editform[ 0 ], { childList: true } );

	function init() {
		$transBtn = $( '.group-translate' );
		$wantt = $( '#wantt-body' );

		$transBtn.after( css );

		// Panel actions
		// Toggle panel display and start dict data acquisition (only first time) when the translate button is clicked
		$transBtn.find( '.oo-ui-buttonElement-button' ).off( 'click' );
		$transBtn.find( '.oo-ui-buttonElement-button' ).on( 'click', togglePanelWhenButtonIsClicked );
		// Hide panel when the close button is clicked
		$wantt.find( 'button[name="closePanel"]' ).on( 'click', hidePanelCloseIsClicked );
		// Hide panel when clicked anywhere except for the panel
		$( document ).on( 'mousedown', hidePanelWhenClickedAnywhere );
		// Insert translation for input to current cursor position on the editor
		$wantt.find( 'button[name="insTranslation"]' ).off( 'click' );
		$wantt.find( 'button[name="insTranslation"]' ).on( 'click', insTranslation );
	}

	function togglePanelWhenButtonIsClicked() {
		$wantt.toggleClass( clsActive );
		if ( !autolinkObj.length || !reverselinkObj.length ) {
			getModuleContent();
		}
	}

	function makeJSONReq() {
		var api = new mw.Api();
		for ( var i in modules ) {
			JSONReqList.push( api.get( {
				action: 'parse',
				format: 'json',
				page: modules[ i ],
				prop: 'text'
			} ) );
		}
	}

	function getModuleContent() {
		makeJSONReq();
		$.when.apply( $, JSONReqList )
		.then( function() {
			$wantt.find( 'input[name="translate"]' ).prop( 'disabled', false );
			for ( var i in arguments ) {
				var text;
				if ( arguments[ i ][ 0 ] !== 'undefined' ) {
					text = arguments[ i ][ 0 ].parse.text[ '*' ];
				} else {
					continue;
				}
				if ( modules[ i ].match( /Auto/ ) ) {
					autolinkObj.push( parseText( text ) );
				} else {
					reverselinkObj.push( parseText( text ) );
				}
			}
		} );

		// Convert dict syntax from lua to js
		function parseText( text ) {
			return JSON.parse( text
				// Remove non-entries
				.replace( /[\s\S]+<pre.+>([\s\S]+)<\/pre>/, '$1' )
				// Remove "return" and comment
				.replace( /return|--.+?\n/g, '' )
				// Replace lua brackets to double quotes
				.replace( /\['(.+?)']/g, '"$1"' )
				// Replace single quotes and char ref double quotes to raw doubles except for include single in value
				.replace( /(\s|=)'|'(\s+"|,)|\[?&quot;]?/g, '$1"$2' )
				.replace( /\s*=\s*/g, ':' )
				// Remove last comma
				.replace( /,(\s+})/g, '$1' )
			);
		}
	}

	function hidePanelCloseIsClicked() {
		$wantt.removeClass( clsActive );
	}

	function hidePanelWhenClickedAnywhere( e ) {
		if (
			!$( e.target ).closest( $wantt ).length &&
			$wantt.hasClass( clsActive )
		) {
			$wantt.removeClass( clsActive );
		}
	}

	function insTranslation() {
		var entryVal = $wantt.find( 'input[name="translate"]' ).val();
		var translation = searchEntry( entryVal.toLowerCase() );
		
		if ( !translation ) {
			showError( i18n.error.notRegistered );
			return;
		}
		
		var $editor = $( '#wpTextbox1' );
		var cursorPos = $editor.get( 0 ).selectionStart;
		// Insertion
		$editor.val( function( _, v ) {
			return v.substring( 0, cursorPos ) + translation + v.substring( cursorPos );
		} );

		// After insertion, focus to the editor field and set cursor position to end of inserted string
		var newCursorPos = cursorPos + translation.length;
		$editor.focus().get( 0 ).setSelectionRange( newCursorPos, newCursorPos );

		function searchEntry( entry ) {
			var result = '';
			var toString = Object.prototype.toString;
			for ( let k in autolinkObj ) {
				var value = autolinkObj[ k ];
				if ( toString.call( value ) === '[object Object]' ) {
					
					for ( let l in value ) {
						if ( !value[ l ] || !value[ l ][ entry ] ) continue;
						result = value[ l ][ entry ];
						break;
					}
				} else {
					if ( !value[ entry ] ) continue;
					result = value[ entry ];
					break;
				}
			}
			// Remove left side of '|' if result contains one
			return result.replace( /.+\|(.+)/, '$1' );
		}
	}

	function showError( reason ) {
		var $error = $wantt.find( '.wantt-error' );
		$error.addClass( clsActive );
		$error.text( reason );
		setTimeout( function() {
			$error.removeClass( clsActive );
		}, 3000 );
	}
} );