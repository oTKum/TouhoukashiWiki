$( function() {
    'use strict';

    const headers = {
        title       : 'アルバム別曲名',
        album       : 'アルバム',
        circle      : 'サークル',
        vocal       : 'Vocal',
        lyric       : 'Lyric',
        chorus      : 'Chorus',
        narrator    : 'Narration',
        rap         : 'Rap',
        voice       : 'Voice',
        whistle     : 'Whistle (口笛)',
        translate   : 'Translation (翻訳)',
        arrange     : 'Arrange',
        artist      : 'Artist',
        bass        : 'Bass',
        cajon       : 'Cajon (カホン)',
        drum        : 'Drum',
        guitar      : 'Guitar',
        keyboard    : 'Keyboard',
        mc          : 'MC',
        mix         : 'Mix',
        piano       : 'Piano',
        sax         : 'Sax',
        strings     : 'Strings',
        synthesizer : 'Synthesizer',
        trumpet     : 'Trumpet',
        violin      : 'Violin',
        original    : '原曲',
        image_song  : 'イメージ曲'
    };

    const rPagename = /(?=^|.*<)(?!.*")(\w{2})\s(((?!<\/a>).)+)/;                      // 楽曲ページ名判定用
    const pagename  = $( 'title' ).text().match( /^.+(?=\s-\s東方同人CDの歌詞)/ )[ 0 ]; // 現在のページ名
    const l         = window.location;                                                 // 制限回避用
    const isMobile  = l.href.includes( 'touhoukashi/sp/' ) ? true : false              // モバイル表示か否か
    const $wikibody = $( '#wikibody' );
    const $args     = $( '#track_args' );
    const $lyrics   = $( '#lyrics' );
    let   $pagename,          // ページ名のjQオブジェクト
          $table,             // トラック情報表のjQオブジェクト
          $infomation,        // インフォ表示のjQオブジェクト
          args,               // オブジェクト化した引数
          existsPrev = false, // 前の曲が挿入されているか
          existsNext = false; // 次の曲が挿入されているか

    if ( $wikibody.length ) {
        // PC
        $pagename = $wikibody.find( '.pagename' );
    } else {
        // Mobile
        $pagename = $( '#atwiki-wrapper' ).find( 'h2.uk-text-middle' );
    }

    const TrackInfobox = {
        /**
         * 初期化
         */
        init: function() {
            // 引数をオブジェクト化
            this.parseArgs();

            // 表生成
            $table = $( this.genTable() );

            // ヘルプ表示
            this.showHelp();

            // 項目リンク化
            this.entryLinking();

            // カラオケ情報表示
            this.insertKaraokeInfo();

            // メディア表示
            $table.append( this.fetchMedia() );

            // アルバムのタグページから曲一覧を取得し、前後の曲を挿入
            this.fetchAlbumTag()
            .then( res => this.insertSongsAround( res ) )
            // 実行に関する情報があれば表示
            // 非同期処理のため一番最後の処理となる可能性が高い。そのためここで呼び出し
            .finally( () => this.appendInfomationToTable() );

            // スマホ表示用のスタイル適用
            const ua = navigator.userAgent;
            if ( ua.match( /(iPhone|iPod|Android)(?=.*Mobile)/ ) ) {
                $table.addClass( 'mobile' );
            }

            // 表を挿入
            $args.after( $table );

            // ページ名のトラック番号を太字に
            this.modifyPagename();

            // 歌詞整形
            if ( !$lyrics.length ) {
                $table.after(
                    '<div class="error"><span style="font-weight: bold">Script: track</span>'
                    + '<br>曲の歌詞を以下の形式で指定してください。'
                    + '<br><br>#divid(lyrics){<br>（ここに歌詞）<br>}'
                    + '</div>'
                );
            } else {
                this.modifyLyrics();
            }
        },

        /**
         * 引数記述を解析し、オブジェクトに変換
         */
        parseArgs: function() {
            const localArgs = $args.html()
                .replace( /\|/, '' )
                .replace( /<[!\/]?(!--@+--|div|br)>|\t|\n/g, '' )
                .split( '|' );
            let data = {};

            // 引数をオブジェクト化
            for ( const arg of localArgs ) {
                let hash = arg
                    .replace( '=', '::' )  // HTML タグ考慮
                    .split( '::' );

                if ( hash[ 1 ].indexOf( ';' ) > -1 ) {
                    // 複数指定の判定
                    // HTML タグと文字参照に含まれるセミコロンの対象除外処理
                    hash[ 1 ] = hash[ 1 ]
                        .replace( /(<.+?>|&.+?;)/g, function() {
                            return arguments[ 0 ].replace( ';', ':$:' );
                        } )
                        .split( ';' );

                    $.each( hash[ 1 ], ( i, v ) => {
                        return hash[ 1 ][ i ] = v.replace( /:\$:/g, ';' );
                    } );
                }
                data[ hash[ 0 ] ] = hash[ 1 ];
            }
            args = data;
        },

        /**
         * 引数からトラック表を生成
         */
        genTable: function() {
            const title     = args[ 'title' ];      // 曲名
            const escKey    = /^(next|prev)$/;      // 表生成時に除外するキー
            const escValue  = /^(\s*|\r|\n|\r\n)$/; // 表生成時に除外する値
            let   table     = '<table id="trackinfo" border="1"><thead><tr><th colspan="2">';

            // タイトル表示処理
            if ( title ) {
                // タイトル指定があればそれを表示
                // 複数指定がある場合は1番目をヘッダーに
                table += ( $.isArray( title ) )
                    ? title[ 0 ]
                    : title;
            } else {
                // 指定がなかったらページ名から判別
                table += ( rPagename.test( pagename ) )
                    ? pagename.slice( 3 )
                    : ( pagename )
                    ? pagename
                    : 'トラック情報';
            }

            table += '</th></tr></thead><tbody>';

            // 各引数の表示処理
            for ( const [ k, v ] of Object.entries( args ) ) {
                // 条件に満たない引数は弾く
                if (
                    escKey.test( k )                        // 除外指定されたキーの場合
                    || escValue.test( v )                   // 除外指定された値の場合
                    || !headers[ k ]                        // 未登録パラメータの場合
                    || ( k === 'title' && !$.isArray( v ) ) // タイトルの場合に、指定が複数でない場合
                ) continue;

                table += '<tr class="trackrow ' + k + '">'
                    + '<th>' + headers[ k ] + '</th><td>';

                // 複数指定処理
                if ( $.isArray( v ) ) {
                    table += '<ul>';

                    for ( const i in v ) {
                        if ( k === 'title' && Number( i ) === 0 ) {
                            continue;
                        }

                        table += '<li>' + v[ i ] + '</li>';
                    }

                    table += '</ul>';
                } else {
                    table += v;
                }
                table += '</td></tr>';
            }
            table += '</tbody><tfoot></tfoot></table>';

            return table;
        },

        /**
         * 引数に指定された各メディアを取得し、表示
         */
        fetchMedia: function() {
            const media = args[ 'media' ];

            if ( !media ) return;

            let links = ( $.isArray( media ) )
                ? media.join()
                : media;
            links = links.replace( /<.+?>|\s/g, '' );

            const ytId   = links.match( /(?=^|\b)(?=[\w-]{0,10}[A-Z])(?![sn]m)(?!\s)[\w-]{11}(?=$|,)/g );
            const nicoId = links.match( /[sn]m\d{1,14}/g );
            let   scUrl  = links.match( /(?=^|\b)(?!watch|com|jp|be)[\w-]+\/[\w-]+(?=$|,)/ );
            let   html   = '<tr class="trackrow media">'
                + '<th colspan="2">メディア</th>'
                + '</tr><tr class="trackrow media">'
                + '<td colspan="2">';

            if ( !ytId && !nicoId && !scUrl ) return;

            // YouTube
            if ( ytId ) {
                html += '<div class="youtube">';
                html += nicoId || scUrl
                    ? '<div class="media_section">YouTube</div>'
                    : '';
                for ( const id of ytId ) {
                    html += '<iframe width="100%" src="'
                        + 'https://youtube.com/embed/' + id
                        + '?showinfo=0" frameborder="0" allowfullscreen></iframe>';
                }
                html += '</div>';
            }

            // Niconico
            if ( nicoId ) {
                html += '<div class="nicovideo">';
                html += ytId || scUrl
                    ? '<div class="media_section">ニコニコ動画</div>'
                    : '';
                for ( const id of nicoId ) {
                    html += '<iframe width="100%" src="'
                        + 'https://embed.nicovideo.jp/watch/' + id
                        + '" frameborder="0" allowfullscreen></iframe>';
                }
                html += '</div>';
            }

            // Soundcloud
            if ( scUrl ) {
                html += '<div class="soundcloud">';
                html += ytId || nicoId
                    ? '<div class="media_section">Soundcloud</div>'
                    : '';
                html += '</div>';
                scUrl = 'https://soundcloud.com/' + scUrl[ 0 ];
                scUrl = 'https://soundcloud.com/oembed?format=js&url=' + scUrl + '&callback=?';

                $.getJSON( scUrl, data => {
                    const html = data.html.replace( 'height="400"', '' );
                    $table.find( '.soundcloud' ).append( html );
                } );
            }
            html += '<span class="media_notice">サークルが公開、もしくはサークルの許可を得て制作されているメディア以外の指定はお控えください</span></td>';

            return html;
        },

        /**
         * アルバム名のタグページから楽曲リストを取得するプロミスを返す
         */
        fetchAlbumTag: function() {
            return new Promise( ( resolve, reject ) => {
                // Fetch API非対応か、アルバム未指定の場合は動作しない
                if ( !window.fetch ) {
                    this.addInfomationEntry( 'このブラウザはFetch APIに対応していないため、前後の楽曲情報の自動取得は実行されません。' );
                    reject();
                }

                if ( !args[ 'album' ] ) {
                    this.addInfomationEntry( '引数にアルバム指定がないため、前後の自動楽曲情報の取得は実行されません。' );
                    reject();
                }

                // タグページへの相対リンク
                // pc_/modeは、モバイル表示時でも動作するように付加
                const albumTagUrl = `/touhoukashi/tag/${
                    $.isArray( args[ 'album' ] )
                        ? $( args[ 'album' ][ 0 ] ).text()
                        : $( args[ 'album' ] ).text()
                }?pc_${ '' }mode=1`;

                fetch( encodeURI( albumTagUrl ) ).then( res => resolve( res.text() ) );
            } );
        },

        /**
         * カラオケのリクエスト番号の表エントリを作成し、挿入
         */
        insertKaraokeInfo: function() {
            const $karaoke = $( `
                <tr class="trackrow karaoke_info">
                    <th>カラオケ<br>配信情報</th>
                    <td>
                        <dl>
                            <dt id="karaoke_dam">DAM</dt>
                            <dd id="karaoke_dam_content">
                                選曲番号：<span id="karaoke_dam_req">不明</span>
                            </dd>
                            <dt id="karaoke_joysound">JOYSOUND</dt>
                            <dd id="karaoke_joysound_content">
                                曲番号：<span id="karaoke_joysound_req">不明</span>
                            </dd>
                        </dl>
                    </td>
                </tr>
            ` );

            const damReqNo      = args[ 'dam_req' ] ? args[ 'dam_req' ].trim() : null;
            const damReqUrl     = args[ 'dam_url' ] ? args[ 'dam_url' ].trim() : null;
            const rDamReqFormat = /^\d{4}-\d{2}$/;

            // DAM
            // none指定なら未配信表示
            if ( damReqNo === 'none' ) {
                $karaoke.find( '#karaoke_dam_req' ).text( '未配信' );
            } else if ( damReqNo ) {
                // 選曲番号のフォーマットでなければ例外表示
                if ( rDamReqFormat.test( damReqNo ) ) {
                    // URL指定があればそちらにリンク
                    const damUrl = damReqUrl
                        ? $( damReqUrl ).attr( 'href' )
                        : 'https://www.clubdam.com/karaokesearch/songleaf.html?requestNo=' + damReqNo;
                    const $dam   = $( `<a href="${ damUrl }">${ damReqNo }</a>` );

                    $karaoke.find( '#karaoke_dam_req' ).html( $dam );
                } else {
                    this.addInfomationEntry( 'DAMの選曲番号は<span class="code">(半角数字4字)-(半角数字2字)</span>の形式で指定してください。' );
                }
            }

            const joyReqNo      = args[ 'joy_req' ] ? args[ 'joy_req' ].trim() : null;
            const joyReqUrl     = args[ 'joy_url' ] ? args[ 'joy_url' ].trim() : null;
            const rJoyReqFormat = /^\d+$/;

            // JOYSOUND
            // none指定なら未配信表示
            if ( joyReqNo === 'none' ) {
                $karaoke.find( '#karaoke_joysound_req' ).text( '未配信' );
            } else if ( joyReqNo ) {
                // 曲番号のフォーマットでなければ例外表示
                if ( rJoyReqFormat.test( joyReqNo ) ) {
                    $karaoke.find( '#karaoke_joysound_req' ).html(
                        // URL指定があればそちらにリンク
                        joyReqUrl
                            ? `<a href="${ $( joyReqUrl ).attr( 'href' ) }">${ joyReqNo }</a>`
                            : joyReqNo
                    );
                } else {
                    this.addInfomationEntry( 'JOYSOUNDの曲番号は半角数字のみで指定してください。' );
                }
            }

            $table.append( $karaoke );
        },

        /**
         * 前後の楽曲を挿入
         * @param {string} albumTagContent 楽曲リストを取得するアルバムタグページの名前
         */
        insertSongsAround: function( albumTagContent ) {
            const $tagHtml       = $( albumTagContent );                                // タグページから取得したHTMLのjQオブジェクト
            const $entryList     = $tagHtml.find( '.cmd_tag ul' ).eq( 0 ).find( 'li' ); // 曲のjQオブジェクト
            const rIsHtmlElement = /<a[\s\S]*>/i;                                       // HTMLタグ判別用のRegExp

            // タグ登録ページおよび前後の曲指定がなければ終了
            if ( !$entryList.length && !args[ 'prev' ] && !args[ 'next' ] ) return;

            const currentPageTrackNumber = rPagename.test( pagename ) // 現在表示してるページのトラック番号
                ? Number( pagename.match( rPagename )[ 1 ] )
                : 0;
            let html = ''; // HTML構造用

            html += '<tr class="trackrow prev-and-next"><td colspan="2">';

            // 前後の曲指定があった場合の処理
            if ( args[ 'prev' ] ) {
                if ( args[ 'prev' ] === 'none' ) {
                    // none指定だった場合はテキストなしで挿入
                    html       += '<span class="prev-track"></span>';
                    existsPrev  = true;
                } else if ( rIsHtmlElement.test( args[ 'prev' ] ) ) {
                    // 指定にaタグが含まれる場合は挿入
                    html       += this._genPrevTrackHtml( args[ 'prev' ] );
                    existsPrev  = true;
                } else {
                    // リンクでなければ例外
                    this.addInfomationEntry( '前トラックはリンクで指定してください。' );
                }
            }

            if ( args[ 'next' ] ) {
                if ( args[ 'next' ] === 'none' ) {
                    // none指定だった場合はテキストなしで挿入
                    html       += '<span class="next-track"></span>';
                    existsNext  = true;
                } else if ( rIsHtmlElement.test( args[ 'next' ] ) ) {
                    // 指定にaタグが含まれる場合は挿入
                    html       += this._genNextTrackHtml( args[ 'next' ] );
                    existsNext  = true;
                } else {
                    // リンクでなければ例外
                    this.addInfomationEntry( '次トラックはリンクで指定してください。' );
                }
            }

            // 前後両方の指定が正常に挿入されていた場合は終了
            if ( existsPrev && existsNext ) {
                html += '</td></tr>';
                $table.append( html );

                return;
            }

            // タグページへの相対リンク
            const tagPageLink = ( () => {
                const album = $.isArray( args[ 'album' ] )
                    ? $( args[ 'album' ][ 0 ] ).text()
                    : $( args[ 'album' ] ).text();
                let result = '<a href="/touhoukashi/';

                result += isMobile ? 'sp/' : '';
                result += `tag/${ encodeURI( album ) }">${ album }</a>`;

                return result;
            } )();

            // 曲一覧から前後の曲を探す
            for ( const [ k, entry ] of Object.entries( $entryList ) ) {
                // 前後両方を取得できているなら終了
                if ( html.includes( 'prev-track' ) && html.includes( 'next-track' ) ) break;
                if ( isNaN( k ) ) continue;

                const $item     = $( entry ).find( 'a' ); // 現ループのa
                const trackName = $item.text().trim();    // 現ループの曲名

                // 楽曲名が不正なら弾く
                if ( !trackName ) continue;

                // 現ループのトラック番号
                const trackNumber = rPagename.test( trackName )
                    ? Number( trackName.match( rPagename )[ 1 ] )
                    : 0;

                // 指定による挿入がなく、前後のトラック番号であれば自動取得
                // ただし、タグページに前後の同一トラック番号が複数ある場合は例外表示
                if ( !existsPrev && trackNumber === currentPageTrackNumber - 1 ) {
                    if ( this._countSameTrackNumber( $entryList, trackNumber ) > 1 ) {
                        this.addInfomationEntry(
                            `タグページ「${ tagPageLink }」には前のトラック番号である「${ currentPageTrackNumber - 1 }」を含む楽曲が複数あるため、自動挿入は実行されませんでした。` );

                        continue;
                    }

                    html += this._genPrevTrackHtml( $item );
                    existsPrev = true;
                } else if ( !existsNext && trackNumber === currentPageTrackNumber + 1 ) {
                    if ( this._countSameTrackNumber( $entryList, trackNumber ) > 1 ) {
                        this.addInfomationEntry(
                            `タグページ「${ tagPageLink }」には次のトラック番号である「${ currentPageTrackNumber + 1 }」を含む楽曲が複数あるため、自動挿入は実行されませんでした。` );

                        continue;
                    }

                    html += this._genNextTrackHtml( $item );
                    existsNext = true;

                    continue;
                }
            }

            html += '</td></tr>';

            // 前後の楽曲どちらもが取得できてなかったら例外を表示し、挿入しない
            if ( !existsPrev && !existsNext ) {
                this.addInfomationEntry( 'アルバムタグページの情報を取得できなかったため、前後の楽曲情報の自動挿入は実行されませんでした。' );
                return;
            }

            $table.append( html );
        },

        /**
         * 前トラックへのリンク生成
         * @param {object} $jqLinkObject 挿入する前トラックのリンクオブジェクト
         */
        _genPrevTrackHtml: function( $jqLinkObject ) {
            // 配列の場合はパラメータ指定された場合のため、それ用に変形
            $jqLinkObject = $.isArray( $jqLinkObject )
                ? $( $jqLinkObject[ 0 ] )
                : $( $jqLinkObject );

            return `
            <span class="prev-track">
                ${ $( $jqLinkObject )
                // モバイル表示だったらモバイルリンクに変換
                .attr( 'href', ( _, attr ) => {
                    return isMobile
                        ? attr.replace( '/touhoukashi/', '/touhoukashi/sp/' )
                        : attr;
                } )
                // titleをページ名で置換
                .attr( 'title', function() { return $( this ).text().trim(); } )
                .html( '<span style="margin-right: -.5em">&#9664;</span>&#9664; 前の曲' )
                .prop( 'outerHTML' ) }
            </span>
            `;
        },

        /**
         * 後トラックへのリンク生成
         * @param {object} $jqLinkObject 挿入する後トラックのリンクオブジェクト
         */
        _genNextTrackHtml: function( $jqLinkObject ) {
            $jqLinkObject = $.isArray( $jqLinkObject )
                ? $( $jqLinkObject[ 0 ] )
                : $( $jqLinkObject );

            return `
            <span class="next-track">
                ${ $( $jqLinkObject )
                // モバイル表示だったらモバイルリンクに変換
                .attr( 'href', ( _, attr ) => {
                    return isMobile
                        ? attr.replace( '/touhoukashi/', '/touhoukashi/sp/' )
                        : attr;
                } )
                // titleをページ名で置換
                .attr( 'title', function() { return $( this ).text().trim(); } )
                .html( '次の曲 <span style="margin-right: -.5em">&#9654;</span>&#9654;' )
                .prop( 'outerHTML' ) }
            </span>
            `;
        },

        /**
         * 指定したトラック番号である楽曲をタグ一覧内からカウントする
         * @param {object} $entryList 検索対象のjQオブジェクト
         * @param {int} trackNumberToSearch カウントするトラック番号
         */
        _countSameTrackNumber: function( $entryList, trackNumberToSearch ){
            let count = 0; // 指定トラック番号が存在した回数

            for ( const entry of Object.values( $entryList ) ) {
                // li要素じゃなかったら終了
                if ( !$( entry ).is( 'li' ) ) break;

                const trackName = $( entry ).text().trim(); // 現ループの曲名

                // 楽曲名が不正なら弾く
                if ( !trackName || !rPagename.test( trackName ) ) continue;

                const trackNumber = Number( trackName.match( rPagename )[ 1 ] ); // 現ループのトラック番号

                if ( trackNumberToSearch === trackNumber ) count++;
            }

            return count;
        },

        /**
         * ボーカルおよび原曲の項目をタグページとしてリンクさせる
         */
        entryLinking: function() {
            const target = '.vocal td:not(:has(ul)), .original td:not(:has(ul)), .vocal li, .original li';

            return $table.find( target ).html( ( _, elem ) => {
                const items = elem.match( /[^<>]+(?![^<]*>|[^<>]*<\/)|.*>|.*<\//g );

                // HTMLタグがなければ終了
                if ( !items[ 0 ] ) return;

                for ( let i in items ) {
                    items[ i ] = items[ i ].trim();
                }

                const page = encodeURI( items[ 0 ].replace( /\((.+?)\)/g, '（$1）' ) ).trim();
                let result;

                result = '<a href="/touhoukashi/tag/' + page + '">';

                if ( items[ 1 ] ) {
                    if ( elem.indexOf( items[ 0 ] ) < elem.indexOf( items[ 1 ] ) ) {
                        // タグがリンクするテキストの後にあったら
                        result += items[ 0 ] + items[ 1 ];
                    } else {
                        // 前にあったら
                        result += items[ 1 ] + items[ 0 ];
                    }
                } else {
                    // なかったら
                    result += items[ 0 ];
                }
                result += '</a>';

                return result;
            } );
        },

        /**
         * ページ名の表示を整形
         */
        modifyPagename: function() {
            return $pagename.html( () => {
                return pagename.replace( rPagename, '<span class="track_number">$1</span> $2' );
            } );
        },

        /**
         * 歌詞の表示を整形し、マークアップを追加する
         */
        modifyLyrics: function() {
            const notInCard = '<div class="not_in_card">'
                + '<span>$1</span>'
                + '<span class="tooltip">この歌詞は歌詞カードへの記載がありません</span>'
                + '</div>';
            const inaudible = '<div class="inaudible">'
                + '<span class="img"></span>'
                + '<span class="tooltip">この箇所は歌詞カードへの記載がなく、'
                + '<br>かつ聞き取りが困難であったことを示します</span>'
                + '</div>';
            let $notInCard, $tooltip;

            $lyrics.html( ( _, elem ) => {
                return elem
                    // 歌詞カード未記載歌詞
                    // $1: マークアップ内の内容
                    .replace( /__(.+?((\n.+?)+?)?)__/g, notInCard )
                    // 正しく聞き取れなかった歌詞
                    .replace( /[(（]([?？]{3}|聴音不可)[)）]/g, inaudible );
            } );

            $notInCard = $lyrics.find( '.not_in_card' );
            $tooltip   = $notInCard.children( '.tooltip' );

            $lyrics.find( '.inaudible' ).on( {
                mouseenter: () => {
                    $tooltip.toggleClass( 'hide' );
                    $notInCard.toggleClass( 'hide' );
                },
                mouseleave: () => {
                    $tooltip.toggleClass( 'hide' );
                    $notInCard.toggleClass( 'hide' );
                }
            } );

            // 整形した歌詞を挿入
            $table.after( $lyrics );

            return true;
        },

        /**
         * 表上にマニュアルページへのリンクを表示する
         */
        showHelp: function() {
            const $help = $( `
                <div id="trackinfo_help">
                    <a href="/touhoukashi/pages/2442.html">ヘルプ</a>
                </div>
            ` );

            $table.find( 'thead' ).append( $help );
        },

        /**
         * インフォメーション表示のjQオブジェを生成する
         */
        createInfomationElement: function() {
            $infomation = $( `
                <tr class="trackrow info_header">
                    <th colspan="2">
                        <span id="infomations_count">_</span>件の情報があります
                        <span class="infomation_show_btn_wrapper">[<a class="infomation_show_btn">表示<a/>]</span>
                    </th>
                </tr>
                <tr class="trackrow info_content">
                    <td colspan="2">
                        <ul id="infomations_content"></ul>
                    </td>
                </tr>
            ` );

            // 表示ボタンクリックでインフォ表示切り替え
            $infomation.find( '.infomation_show_btn' ).on( 'click', elem => {
                $( elem.target ).text( $infomation.hasClass( 'infomation_show' ) ? '表示' : '非表示' );
                $infomation.eq( 2 ).toggleClass( 'infomation_show' );
            } );
        },

        /**
         * インフォメーションに項目を追加する
         * @param {string} summary 追加する項目の内容
         */
        addInfomationEntry: function( summary ) {
            // 内容がすでに追加されたエントリに存在するか否か
            let isDuplicate = false;

            // インフォオブジェクト未生成なら作成
            if ( !$infomation ) {
                this.createInfomationElement();
            }

            // 重複チェック
            $.each( $infomation.find( 'li' ), ( _, elem ) => {
                if ( $( elem ).html() === summary ) isDuplicate = true;
            } );

            // 重複していれば追加しない
            if ( isDuplicate ) return;

            // エントリー追加
            $infomation
            .find( '#infomations_content' )
            .append( `<li>${ summary }</li>` );

            // 非同期処理後の追加の場合は件数をインクリメントする
            if ( $( '#infomations_count' ).length ) {
                $infomation
                .find( '#infomations_count' )
                .text( ( _, text ) => Number( text ) + 1 );
            }
        },

        /**
         * インフォメーションを表にアペンド
         */
        appendInfomationToTable: function() {
            // インフォオブジェクトがなければ終了
            if ( !$infomation ) return;

            // 追加されたインフォ数をカウントし、表示
            $infomation.find( '#infomations_count' ).text(
                $infomation.find( 'li' ).length );

            // 表末尾に追加
            $table.find( 'tfoot' ).append( $infomation );
        }
    };

    TrackInfobox.init();

} );
