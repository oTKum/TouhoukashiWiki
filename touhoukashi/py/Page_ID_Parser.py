# -*- coding: utf-8 -*-
import json
import re
import requests
import time
from bs4 import BeautifulSoup
from pathlib import Path


def log(msg, tab=0, color='black'):
    colors = {
        'black': 30,
        'red': 31,
        'green': 32,
        'yellow': 33,
        'blue': 34,
        'magenta': 35,
        'cyan': 36
    }
    color = colors[color]
    tabs = ''
    result = ''

    for i in range(tab):
        tabs += '\t'
    else:
        result += tabs

    if msg.count('>'):
        msg = re.sub(r'^(\t*)(>+)', fr'\1\033[1;4;{color}m\2\033[0;{color}m', msg)
    if re.findall(r'\[b\].+?\[/b\]', msg):
        msg = re.sub(r'\[b\](.+?)\[/b\]', fr'\033[1;{color}m\1\033[0;{color}m', msg)

    try:
        result += f'\033[0;{color}m{msg}\033[0;39m'
    except KeyError:
        result += msg

    return print(result)


def get_title(url):
    res = requests.get(url)
    soup = BeautifulSoup(res.content, 'html.parser')
    title = soup.title.string
    result = re.match(r'^.+(?=\s-\s東方同人CDの歌詞)', title).group()
    return result


def main():
    url_prefix = 'https://www31.atwiki.jp/touhoukashi/'
    i = 3000  # 開始ID
    added = 0  # 追加項目数
    updated = 0  # 変更項目数
    not_exist_count = 0  # ページが存在しなかった連続回数
    data = {}  # 収集データ
    save_dir = Path.cwd()/'save ids'
    save_file = save_dir/'ids.json'
    js_file = Path.cwd().parent/'js/pageIds.js'
    is_first = True

    log('>> 解析開始', color='cyan')
    start = time.time()

    while True:
        url = f'{url_prefix}{i}.html'
        # res = requests.get(url)
        # soup = BeautifulSoup(res.text, 'html.parser')
        try:
            title = get_title(url)
        except AttributeError:
            log(f'\n>> {i}.html', 0, 'magenta')
            log('タイトルの取得に失敗したためスキップします', 1, 'red')
            i += 1
            continue

        if is_first:
            is_first = False
            if not Path(save_dir).exists():
                log('>> json の保存ディレクトリおよび保存ファイルが存在しないため作成します')
                Path(save_dir).mkdir()
                with save_file.open('w'):
                    pass
            elif not Path(save_file).exists():
                log('>> json の保存ファイルが存在しないため作成します')
                with save_file.open('w'):
                    pass
            else:
                try:
                    with save_file.open(encoding='utf-8') as f:
                        data = json.load(f)
                except json.JSONDecodeError:
                    log('>> json ファイルの読み込みに失敗しました', 0, 'red')

            if not Path(js_file).exists():
                log('>> js の保存ファイルが存在しないため作成します')
                with js_file.open('w'):
                    pass
            else:
                global js_lines
                with js_file.open('r', encoding='utf-8') as f:
                    js_lines = f.readlines()

        # 前回までの最終項目
        last_index = max(data.values())

        if title == 'エラー':
            # ページが存在しなければスキップ
            # 50回連続スキップした場合は処理を終了
            if i < last_index and not_exist_count <= 50:
                log(f'\n>> {i}.html', 0, 'magenta')
                time.sleep(0.2)
                log('存在しないページのためスキップします', 1)
                i += 1
                not_exist_count += 1
                time.sleep(0.7)
                continue
            break
        elif not_exist_count > 0:
            not_exist_count = 0

        org_key = [k for k, v in data.items() if v == i]

        log(f'\n>> {i}.html: [b]{title}[/b]', 0, 'magenta')
        time.sleep(0.3)

        if title not in data:
            if i not in data.values():
                log('>> 新規追加', 1, 'green')
                data[title] = i
                added += 1
            else:
                log('>> 登録変更', 1, 'yellow')
                log(f'{org_key[0]} => {title}', 2)
                data[title] = data.pop(org_key[0])
                updated += 1
        else:
            log('変更はありません', 1)

        time.sleep(0.6)
        i += 1

    process_time = time.time() - start
    log('>> 解析終了', 0, 'cyan')
    if not_exist_count is 50:
        log('おそらく最終ページに到達しました\n', 1)

    # 追加・更新項目があれば保存
    if added or updated:
        log('調査結果を json, js として以下にそれぞれ保存しました')
        log(f'json: "{save_file}"')
        log(f'js: "{js_file}"\n')
        sorted_data = sorted(data.items(), key=lambda x: x[1])
        data = dict(sorted_data)
        json_data = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        js_lines[0] = f'const PAGEID={json_data}\n'
        # jsonとして
        with save_file.open('w', encoding='utf-8') as f:
            f.write(json_data)
        # jsとして
        with js_file.open('w', encoding='utf-8') as f:
            f.writelines(js_lines)

    log(f'総合ページ数: {i - 1}')
    log(f'追加ページ数: {added}')
    log(f'更新ページ数: {updated}')
    log(f'合計処理ページ数: {added + updated}')
    log(f'処理時間: {process_time}')
    return data


if __name__ == '__main__':
    main()
