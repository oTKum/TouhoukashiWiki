$( function() {
	'use strict';

	/* ----- 更新履歴 -----
	2018-07-:
		-実装
	*/

	const css = '<link rel="stylesheet" type="text/css" href="https://use.fontawesome.com/releases/v5.2.0/css/all.css">'
	$( 'head link:last' ).after( css );

	const scroll = ( function() {
		const elem = ( function() {
			if ( 'scrollingElement' in document ) {
				return document.scrollingElement;
			}
			if ( navigator.userAgent.indexOf( 'WebKit' ) != -1 ) {
				return document.body;
			}
			return document.documentElement;
		} )();
		const speed = 300;
		const easing = 'swing';

		function scrollTo( sel, dir ) {
			console.log(dir)
			const $href = $( sel ).attr( 'href' );
			console.log($('html').offset())
			$( elem ).animate( {
				scrollTop: dir == 'top'
					? $( $href == '#' ? 'html' : $href ).offset().top
					: $( document ).height()
			}, speed, easing );
		}

		return {
			toTop: function() {
				scrollTo( this, 'top' );
			},
			toBottom: function() {
				scrollTo( this, 'bottom' );
			}
		}
	} )();

	const $button = $( '<div>', { 'class': 'scroll' } );
	const $top    = $( '<a>', { href: '#', 'id': 'page-top' } );
	const $bottom = $( '<a>', { href: '#footer', 'id': 'page-bottom' } );

	$top.append( '<i class="fas fa-angle-up"></i>' );
	$bottom.append( '<i class="fas fa-angle-down"></i>' );
	$top.on( 'click', scroll.toTop );
	$bottom.on( 'click', scroll.toBottom );

	$button.append( $top, $bottom ).appendTo( $( '#wikibody' ) );

} );