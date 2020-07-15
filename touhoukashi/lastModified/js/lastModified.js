$( function() {
	'use strict';

	// ConfigHandler用処理。実装後に
	// const config = {
	// 	name: 'PoteJS-lastModfied',
	// 	value: JSON.parse( localStorage.getItem( this.name ) ),
	// 	default: true
	// }

	// if ( config.value === null ) {
	// 	localStorage.setItem( config.name, config.default );
	// } else if ( config.value === false ) {
	// 	return;
	// }

	// 二重処理防止
	if ( $( '.last-modified' ).length ) return;

	const $jsonLd = $( 'script[type="application/ld+json"]' );

	// JSON-LDがなければ終了
	if ( !$jsonLd.length ) return;

	const data = JSON.parse( $jsonLd.text() );

	// 正常なデータじゃなければ終了
	if ( !data || !data[ 0 ] ) return;

	const pagename = data[ 0 ].headline;
	const modified = data[ 0 ].dateModified.split( '+' )[ 0 ].split( 'T' );
	let dateYmd, dateTime;

	// 未作成ページなら終了
	if ( /^「.+?」は見つかりません$/.test( pagename ) ) return;

	dateYmd = modified[ 0 ]
		.replace( /-0/g, '-' )
		.replace( '-', '年' )
		.replace( '-', '月' )
		+ '日';

	dateTime = modified[ 1 ]
		.replace( /(^|:)0/g, '$1' )
		.replace( ':', '時' )
		.replace( ':', '分' )
		+ '秒';

	$( '#pageTabs' ).prepend(
		'<span class="last-modified">最終更新日時：' + dateYmd + ' ' + dateTime + '</span>' );
} );