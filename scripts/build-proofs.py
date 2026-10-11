import html
import json
import os
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'public/proofs'
CATALOG = json.loads((ROOT / 'proofs/catalog.json').read_text())


def escape(value):
    return html.escape(str(value), quote=True)


def page(title, content, prefix='../'):
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Execução verificável, código aberto e demonstrações dos projetos de Brunno Dev."><title>{escape(title)} | Brunno Dev</title><link rel="stylesheet" href="{prefix}style.css"></head><body><header><nav class="shell"><a class="brand" href="{prefix}">Brunno<span> / </span>Projetos em execução</a><a href="https://github.com/brunnojob">GitHub ↗</a></nav></header><main class="shell">{content}</main><footer><div class="shell">Código aberto e evidências verificáveis. <a href="https://brunnodev.store">Brunno Dev</a> · <a href="https://github.com/brunnojob/devstart-lab/tree/main/proofs">Dados e fontes do catálogo</a></div></footer></body></html>'''


def links(item):
    name = item['name']
    result = f'<a class="button" href="https://github.com/brunnojob/{name}">Código no GitHub ↗</a><a class="button" href="{escape(item["run_url"])}">Execução no Actions ↗</a>'
    if item.get('demo'):
        result = f'<a class="button primary" href="demo/">Executar no navegador →</a>' + result
    return result


def detail(item):
    name = item['name']
    folder = TARGET / name
    folder.mkdir(parents=True, exist_ok=True)
    report = json.loads((ROOT / 'proofs/evidence' / f'{name}.json').read_text()) if item.get('report') else None
    sha = item['sha']
    source = f'https://github.com/brunnojob/{name}/tree/{sha}'
    content = f'<section class="hero"><p class="eyebrow">{escape(item["language"])} / {"Demo executável" if item.get("demo") else "Execução registrada"}</p><h1>{escape(item["title"])}</h1><p class="lead">{escape(item["description"])}</p><div class="links">{links(item)}</div></section>'
    content += f'<section class="block"><h2>O que foi verificado</h2><p class="notice">{escape(item["scope"])}</p>'
    if item.get('parent'):
        content += f'<p class="small">Este repositório é um fork de <a href="https://github.com/{escape(item["parent"])}">{escape(item["parent"])}</a>. A execução corresponde ao fork; a autoria e a licença original são preservadas.</p>'
    content += f'<dl class="meta"><div><dt>Versão executada</dt><dd><a href="{source}"><code>{sha}</code></a></dd></div><div><dt>Registro</dt><dd>{escape(report["generated_at"] if report else item["recorded_at"])}</dd></div><div><dt>Repositório</dt><dd>brunnojob/{escape(name)}</dd></div><div><dt>Licença</dt><dd>{escape(item["license"])}</dd></div></dl>'
    content += f'<button id="check" data-repo="{escape(name)}" data-workflow="{item["workflow"]}" data-branch="{item["branch"]}" data-sha="{sha}">Consultar última execução</button><p id="status" class="status" role="status">A evidência abaixo pertence à versão registrada. A consulta usa a API pública do GitHub e pode atingir o limite de requisições.</p></section>'
    if report:
        assert report['repository'] == f'brunnojob/{name}' and report['source_commit'] == sha and report['run_url'] == item['run_url'] and report['passed']
        assert report['cases'] and all(case['passed'] for case in report['cases'])
        shutil.copyfile(ROOT / 'proofs/evidence' / f'{name}.json', folder / 'evidence.json')
        transcript = []
        content += '<section class="block"><h2>Comandos e resultados reais</h2><p class="small">Resultados extraídos dos logs do Actions. Saídas extensas podem estar resumidas; a execução original e o artefato contêm o registro completo.</p><a href="evidence.json" download>Baixar relatório JSON</a>'
        for case in report['cases']:
            assert case['exit'] == case['expected_exit']
            command = ' '.join(case['argv'])
            transcript.append('$ ' + command + '\n' + case['output'])
            content += f'<details {"open" if case.get("display") is not False else ""}><summary><span class="tag pass">PASS</span> {escape(case["name"])}</summary><p class="small">Saída: {case["exit"]} · esperada: {case["expected_exit"]} · {case["seconds"]} s</p><pre>$ {escape(command)}\n\n{escape(case["output"])}</pre></details>'
        (folder / 'transcript.txt').write_text('\n'.join(transcript))
        content += '<a href="transcript.txt" download>Baixar transcrição</a></section>'
        content += f'<section class="block"><h2>Reproduzir a execução</h2><p>Os pré-requisitos e as entradas são públicos no repositório. Faça checkout da versão exata antes de executar os cenários.</p><pre>git clone https://github.com/brunnojob/{escape(name)}.git\ncd {escape(name)}\ngit checkout {sha}\npython .proof/record.py</pre><div class="links"><a href="{source}/.proof/scenarios.json">Entradas e critérios de verificação ↗</a><a href="{source}/README.md">Pré-requisitos ↗</a></div></section>'
    else:
        content += '<section class="block"><h2>Aplicação publicada</h2><p>O workflow executa os testes do projeto, gera o build e publica no GitHub Pages. O registro vinculado acima identifica a versão. Use a aplicação e confira os testes no repositório.</p><a class="button primary" href="../../">Abrir DevStart Lab →</a></section>'
    content += '<script type="module" src="../detail.mjs"></script>'
    (folder / 'index.html').write_text(page(item['title'], content))


def source_for(item):
    root = os.environ.get('PROJECT_SOURCE_ROOT')
    if root:
        path = Path(root).resolve() / item['name']
    else:
        path = ROOT / '.sources' / item['name']
        path.mkdir(parents=True, exist_ok=True)
        subprocess.run(['git', 'init', '-q', str(path)], check=True)
        subprocess.run(['git', '-C', str(path), 'fetch', '-q', '--depth', '1', f'https://github.com/brunnojob/{item["name"]}.git', item['sha']], check=True)
        subprocess.run(['git', '-C', str(path), 'checkout', '-q', 'FETCH_HEAD'], check=True)
    assert subprocess.check_output(['git', '-C', str(path), 'rev-parse', 'HEAD'], text=True).strip() == item['sha']
    return path


def demo(item):
    if not item.get('demo'):
        return
    name = item['name']
    destination = TARGET / name / 'demo'
    destination.mkdir(parents=True, exist_ok=True)
    source = source_for(item)
    if item['demo'] == 'casino':
        for filename in ['index.html', 'styles.css', 'app.js', 'engine.mjs', 'LICENSE']:
            shutil.copyfile(source / filename, destination / filename)
        subprocess.run(['node', '--test', *[str(p) for p in (source / 'tests').glob('*.test.mjs')]], check=True, cwd=source)
        return
    if item['demo'] == 'circuit':
        shutil.copyfile(source / 'src/circuit.mjs', destination / 'circuit.mjs')
        shutil.copyfile(source / 'examples/seal-in.json', destination / 'circuit.json')
        shutil.copyfile(source / 'examples/inputs.json', destination / 'input.json')
        shutil.copyfile(ROOT / 'proofs/circuit-demo.mjs', destination / 'demo.mjs')
        body = '<section class="hero"><p class="eyebrow">JavaScript / código original do repositório</p><h1>Circuito elétrico</h1><p class="lead">Altere as entradas e execute os scans do motor. O interpretador original calcula retenção, parada e segurança. Ambiente de treinamento sem conexão com PLC físico.</p><a href="../">Ver evidências e código →</a></section><section class="block"><label for="input">Scans em JSON</label><textarea id="input"></textarea><p class="links"><button class="primary" id="run">Executar scans</button></p><pre id="result" role="status">Aguardando execução.</pre></section><script type="module" src="demo.mjs"></script>'
        (destination / 'index.html').write_text(page('Circuito elétrico', body, '../../'))
        subprocess.run(['node', '--test', *[str(p) for p in (source / 'tests').glob('*.test.mjs')]], check=True, cwd=source)
        return
    if item['demo'] == 'wasm':
        if os.environ.get('SKIP_WASM'):
            return
        subprocess.run(['emcc', str(source / 'src/main.c'), '-std=c17', '-O2', '-lm', '-sMODULARIZE=1', '-sEXPORT_ES6=1', '-sEXIT_RUNTIME=1', '-sINVOKE_RUN=1', '-sEXPORTED_FUNCTIONS=["_main"]', '-sASSERTIONS=1', '-sINCOMING_MODULE_JS_API=["wasmBinary","noInitialRun","stdin","print","printErr","onExit","quit"]', '-sALLOW_MEMORY_GROWTH=1', '-sMAXIMUM_MEMORY=134217728', '-sEXPORTED_RUNTIME_METHODS=["callMain"]', '-sENVIRONMENT=web,worker,node', '-o', str(destination / 'program.mjs')], check=True)
        subprocess.run(['node', str(ROOT / 'scripts/test-wasm.mjs'), str(destination), str(source / '.proof/scenarios.json')], check=True)
        shutil.copyfile(source / 'examples/input.txt', destination / 'input.txt')
        shutil.copyfile(source / 'LICENSE', destination / 'LICENSE')
        shutil.copyfile(TARGET / 'wasm-worker.mjs', destination / 'worker.mjs')
        shutil.copyfile(TARGET / 'wasm-demo.mjs', destination / 'demo.mjs')
        body = f'<section class="hero"><p class="eyebrow">C / WebAssembly</p><h1>{escape(item["title"])}</h1><p class="lead">{escape(item["description"])}</p><p>O arquivo C original é compilado para WebAssembly. Suas entradas são processadas no navegador, sem servidor e sem transmitir comandos a equipamentos.</p><a href="../">Ver versão, formato de entrada e evidências →</a></section><section class="block"><label for="input">Entrada do programa (texto, até 64 KiB)</label><textarea id="input" spellcheck="false"></textarea><p class="links"><button class="primary" data-run="input">Executar código C</button><button data-run="test">Executar autoteste</button><button id="sample">Restaurar exemplo</button></p><pre id="result" class="result" role="status">Aguardando execução.</pre><p class="small">Limites: 8 segundos e 128 MiB. <a href="https://github.com/brunnojob/{name}/blob/{item["sha"]}/FORMAT.md">Formato das entradas ↗</a></p></section><script type="module" src="demo.mjs"></script>'
        (destination / 'index.html').write_text(page(item['title'], body, '../../'))


def main():
    TARGET.mkdir(parents=True, exist_ok=True)
    for item in CATALOG:
        detail(item)
    with ThreadPoolExecutor(max_workers=3) as executor:
        list(executor.map(demo, [item for item in CATALOG if item.get('demo')]))
    languages = sorted({item['language'] for item in CATALOG})
    cards = ''
    for item in CATALOG:
        search = escape((item['name'] + ' ' + item['description'] + ' ' + item['title']).lower())
        cards += f'<article class="card" data-search="{search}" data-language="{escape(item["language"])}"><div><span class="tag">{escape(item["language"])}</span> <span class="tag pass">Execução verificada</span></div><h3>{escape(item["title"])}</h3><p>{escape(item["description"])}</p><div class="links"><a href="{item["name"]}/">Ver evidências →</a>{"<a href=" + chr(34) + item["name"] + "/demo/" + chr(34) + ">Executar demo ↗</a>" if item.get("demo") else ""}</div></article>'
    evidence_count = sum(bool(item.get('report')) for item in CATALOG)
    case_count = sum(len(json.loads((ROOT / 'proofs/evidence' / f'{item["name"]}.json').read_text())['cases']) for item in CATALOG if item.get('report'))
    demo_count = sum(bool(item.get('demo')) for item in CATALOG) + 1
    content = f'<section class="hero"><p class="eyebrow">Brunno Dev / código aberto em execução</p><h1>Código que você<br>pode verificar.</h1><p class="lead">Problemas concretos, programas executados e resultados rastreáveis. Explore cada projeto, confira o commit testado e experimente as demos que funcionam no navegador.</p><p class="small">As evidências mostram o comportamento testado. Testes de software e ambientes de treinamento não comprovam operação em hardware físico ou uma API em produção.</p></section><section class="stats"><div><strong>{len(CATALOG)}</strong><span>projetos existentes</span></div><div><strong>{evidence_count}</strong><span>relatórios de execução</span></div><div><strong>{case_count}</strong><span>cenários registrados</span></div><div><strong>{demo_count}</strong><span>demos no navegador</span></div></section><div class="toolbar"><label for="search">Buscar por projeto ou problema<input id="search" type="search" placeholder="Modbus, estoque, manutenção..."></label><label for="language">Linguagem<select id="language"><option value="">Todas as linguagens</option>{"".join(f"<option>{escape(lang)}</option>" for lang in languages)}</select></label></div><p id="count" class="small" role="status"></p><section class="grid" aria-label="Projetos">{cards}</section><script type="module" src="catalog.mjs"></script>'
    (TARGET / 'index.html').write_text(page('Projetos em execução', content, './'))
    print(f'Published files: {len(CATALOG)} project pages, {case_count} recorded scenarios')


if __name__ == '__main__':
    main()
