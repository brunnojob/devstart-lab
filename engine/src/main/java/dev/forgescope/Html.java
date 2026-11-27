package dev.forgescope;

import java.util.*;
import java.nio.charset.StandardCharsets;
import static dev.forgescope.Data.*;

/** Fully localized offline reports and a native HTML/CSS tour; application logic stays in Java. */
public final class Html {
    static String css() {try(var in=Html.class.getResourceAsStream("/viewer.css")){return new String(Objects.requireNonNull(in).readAllBytes(),StandardCharsets.UTF_8);}catch(Exception e){throw new IllegalStateException(e);}}

    static String tutorialLabel(String language) {
        return switch(language) {case "pt-BR" -> "Como funciona"; case "es" -> "Cómo funciona"; default -> "How it works";};
    }
    static String hubLink(String language) {
        String value=System.getenv("FORGESCOPE_HUB_URL");
        if(value==null||value.isBlank())return "";
        try {
            var uri=java.net.URI.create(value);
            if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null||uri.getQuery()!=null||uri.getFragment()!=null)return "";
            String label=switch(language){case "pt-BR"->"Abrir plataforma web e tour";case "es"->"Abrir plataforma web y tour";default->"Open web platform and tour";};
            return "<a class=\"button primary\" href=\""+html(value.replaceAll("/+$","")+"/?lang="+language)+"\">"+label+" →</a>";
        }catch(IllegalArgumentException e){return "";}
    }
    /** Localized, accessible, JavaScript-free tutorial embedded in every portable report. */
    static String tutorial(String lang) {
        int locale=lang.equals("pt-BR")?1:lang.equals("es")?2:0;
        String[][] copy={
            {"How ForgeScope works", "Como o ForgeScope funciona", "Cómo funciona ForgeScope"},
            {"Follow seven practical steps from setup to a report. Expand a step to copy the exact commands.", "Siga sete etapas práticas, da instalação ao relatório. Expanda uma etapa para copiar os comandos exatos.", "Sigue siete pasos prácticos desde la instalación hasta el informe. Despliega cada paso para copiar los comandos exactos."},
            {"Pages displays example evidence. Actual scans use Java and .NET locally; the offline report works without JavaScript.", "O Pages exibe evidências de exemplo. Análises reais usam Java e .NET localmente; o relatório offline funciona sem JavaScript.", "Pages muestra evidencias de ejemplo. Los análisis reales usan Java y .NET localmente; el informe offline funciona sin JavaScript."},
            {"Explore the sample", "Explore o exemplo", "Explora el ejemplo"},
            {"Click Start demonstration to walk through overview, impact, tests, references, findings and limitations.", "Clique em Iniciar demonstração para percorrer visão geral, impacto, testes, referências, achados e limitações.", "Pulsa Iniciar demostración para recorrer resumen, impacto, pruebas, referencias, hallazgos y limitaciones."},
            {"Install requirements", "Instale os requisitos", "Instala los requisitos"},
            {"Install JDK 21, .NET 10 SDK and Git. These are needed on your computer, not on GitHub Pages.", "Instale JDK 21, SDK .NET 10 e Git. São necessários no seu computador, não no GitHub Pages.", "Instala JDK 21, SDK .NET 10 y Git. Se necesitan en tu equipo, no en GitHub Pages."},
            {"Clone and build", "Clone e compile", "Clona y compila"},
            {"Run this block in a terminal. The Java CLI, Roslyn worker and ASP.NET workbench will be built.", "Execute este bloco no terminal. A CLI Java, o worker Roslyn e o painel ASP.NET serão compilados.", "Ejecuta este bloque en la terminal. Se compilarán la CLI Java, el worker Roslyn y el panel ASP.NET."},
            {"Run a sample scan", "Execute uma análise de exemplo", "Ejecuta un análisis de ejemplo"},
            {"Analyze the bundled Java/C# fixture, supplied patch and CI log. Results are written to .forgescope.", "Analise o exemplo Java/C#, o patch e o log de CI incluídos. Os resultados serão gravados em .forgescope.", "Analiza el ejemplo Java/C#, el parche y registro de CI incluidos. Los resultados se guardarán en .forgescope."},
            {"Read the report", "Leia o relatório", "Lee el informe"},
            {"Open the generated HTML in a browser. Check affected files, candidate tests, engine status, compiler evidence and limitations.", "Abra o HTML gerado no navegador. Confira arquivos afetados, testes candidatos, estado dos mecanismos, evidências do compilador e limites.", "Abre el HTML generado en el navegador. Revisa archivos afectados, pruebas candidatas, estado de los motores, evidencias del compilador y límites."},
            {"Open the local workbench", "Abra o painel local", "Abre el panel local"},
            {"Start ASP.NET Core and open http://127.0.0.1:8765. Filter findings and rescan only the repository configured at startup.", "Inicie o ASP.NET Core e acesse http://127.0.0.1:8765. Filtre achados e analise novamente somente o repositório configurado.", "Inicia ASP.NET Core y visita http://127.0.0.1:8765. Filtra hallazgos y analiza de nuevo solo el repositorio configurado."},
            {"Review and export", "Revise e exporte", "Revisa y exporta"},
            {"Use JSON, SARIF or Markdown after reviewing the evidence. Potential impact is not proof of a defect; reports may contain sensitive paths or snippets.", "Use JSON, SARIF ou Markdown após revisar as evidências. Impacto potencial não comprova defeitos; relatórios podem conter caminhos ou trechos sensíveis.", "Usa JSON, SARIF o Markdown tras revisar las evidencias. El impacto potencial no demuestra un fallo; los informes pueden contener rutas o fragmentos sensibles."},
            {"Open guided tour", "Abrir tour guiado", "Abrir recorrido guiado"}
        };
        String[] commands={
            "",
            "",
            "git clone https://github.com/brunnojob/forgescope.git\ncd forgescope\ndotnet build dotnet/ForgeScope.Worker -c Release\ndotnet build dotnet/ForgeScope.Workbench -c Release\njava tools/Build.java",
            "java -jar build/forgescope.jar examples/sample --changed java/src/shop/Pricing.java --changed csharp/Pricing.cs --diff examples/change.diff --log examples/build.log --csharp-worker dotnet/ForgeScope.Worker/bin/Release/net10.0/ForgeScope.Worker.dll --output .forgescope",
            "",
            "dotnet dotnet/ForgeScope.Workbench/bin/Release/net10.0/ForgeScope.Workbench.dll --report .forgescope/report.json --repo examples/sample --jar build/forgescope.jar --worker dotnet/ForgeScope.Worker/bin/Release/net10.0/ForgeScope.Worker.dll",
            ""
        };
        var b=new StringBuilder("<section class=\"card tutorial\" id=\"how-it-works\" aria-labelledby=\"tutorial-title\"><h2 id=\"tutorial-title\">");
        b.append(html(copy[0][locale])).append("</h2><p>").append(html(copy[1][locale])).append("</p>");
        for(int i=0;i<7;i++){
            b.append("<details").append(i==0?" open":"").append("><summary><span class=\"step-id\">").append(String.format(Locale.ROOT,"%02d",i+1)).append("</span>").append(html(copy[3+i*2][locale])).append("</summary><p>").append(html(copy[4+i*2][locale])).append("</p>");
            if(!commands[i].isEmpty())b.append("<pre><code>").append(html(commands[i])).append("</code></pre>");
            if(i==0)b.append("<a class=\"button\" href=\"#tour-1\">").append(html(copy[17][locale])).append("</a>");
            if(i==4)b.append("<p><code>.forgescope/").append(I18n.file(lang)).append("</code></p>");
            b.append("</details>");
        }
        return b.append("<p class=\"tutorial-note\">").append(html(copy[2][locale])).append("</p></section>").toString();
    }

    public static String render(Map<String,Object> r){return render(r,"en");}
    public static String render(Map<String,Object> r,String language){
        String lang=I18n.language(language);var impact=obj(r.get("impact"));var b=new StringBuilder();
        java.util.function.Function<Object,String> t=s->html(I18n.text(s,lang));
        b.append("<!doctype html><html lang=\"").append(lang).append("\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>ForgeScope · ").append(t.apply("Evidence before edits.")).append("</title><link rel=\"icon\" href=\"assets/branding/favicon.ico\" sizes=\"16x16 32x32 48x48\"><link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"assets/branding/favicon-32.png\"><link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"assets/branding/apple-touch-icon.png\"><style>").append(css()).append("</style></head><body><header><div class=\"brand\">Forge<span>Scope</span></div><span class=\"muted\">").append(t.apply("Evidence before edits.")).append("</span><nav class=\"links\"><a href=\"report.json\">JSON</a><a href=\"report.sarif\">SARIF</a><a href=\"report.md\">Markdown</a></nav></header><nav class=\"languages\" aria-label=\"").append(t.apply("Language")).append("\">").append(I18n.languages(lang,"")).append("</nav><main id=\"overview\"><div class=\"eyebrow\">Java 21 · C# / .NET 10 · ").append(t.apply("Local Java and C# analysis")).append("</div><h1>").append(t.apply("Understand the change. Follow the evidence.")).append("</h1><p class=\"muted\">").append(t.apply("Explore potential impact, investigate diagnostics and review the evidence before editing code.")).append("</p><p>").append(html(r.get("project"))).append(" · ForgeScope 0.3.0</p><div class=\"actions\"><a class=\"button primary\" href=\"#pipeline-1\">").append(t.apply("Start demonstration")).append(" →</a><a class=\"button\" href=\"https://github.com/brunnojob/forgescope#build-and-run\">").append(t.apply("Open local workbench")).append("</a><a class=\"button\" href=\"#how-it-works\">").append(tutorialLabel(lang)).append("</a><a class=\"button\" href=\"#tour-1\">").append(t.apply("Guided demonstration")).append("</a><a class=\"button\" href=\"#revscope-catalog\">").append(CatalogView.label(lang)).append("</a>").append(hubLink(lang)).append("</div><section class=\"overview\">").append(I18n.tour(1,lang)).append("<div class=\"stats\">");
        int[] counts={num(impact.get("modules")),arr(impact.get("affected")).size(),arr(impact.get("test_candidates")).size(),arr(r.get("findings")).size()};String[] labels={"Source modules","Changed / affected files","Test candidates","Review findings"};
        for(int i=0;i<4;i++)b.append("<div class=\"stat\"><strong>").append(counts[i]).append("</strong><span>").append(t.apply(labels[i])).append("</span></div>");
        b.append("</div></section><div class=\"grid\"><section class=\"card\">").append(I18n.tour(2,lang)).append("<h2>").append(t.apply("What could this change affect?")).append("</h2>");
        for(Object v:arr(impact.get("affected"))){var a=obj(v);b.append("<div class=\"chain\"><strong>").append(html(a.get("path"))).append("</strong>");for(Object e:arr(a.get("chain"))){var edge=obj(e);b.append("<div>").append(html(edge.get("source"))).append(":").append(html(edge.get("line"))).append(" → ").append(html(edge.get("target"))).append("</div>");}b.append("</div>");}
        b.append("<p class=\"muted\">").append(t.apply("Source reachability does not prove breakage or test coverage.")).append("</p></section><section class=\"card\">").append(I18n.tour(3,lang)).append("<h2>").append(t.apply("Tests to investigate")).append("</h2>");
        for(Object test:arr(impact.get("test_candidates")))b.append("<p><code>").append(html(test)).append("</code></p>");
        b.append("<h2>").append(t.apply("Analysis engines")).append("</h2>");obj(r.get("engines")).forEach((k,v)->b.append("<p>").append(html(k)).append(" · ").append(t.apply(obj(v).get("status"))).append("</p>"));
        b.append("</section><section class=\"card wide\">").append(I18n.tour(4,lang)).append("<h2>").append(t.apply("Local reference review")).append("</h2>");
        for(Object v:arr(impact.get("unresolved_references"))){var ref=obj(v);b.append("<div class=\"chain\"><strong>").append(html(ref.get("symbol"))).append("</strong><div>").append(html(ref.get("path"))).append(":").append(html(ref.get("line"))).append(" → ").append(html(ref.get("target"))).append("</div><p>").append(t.apply(ref.get("reason"))).append("</p></div>");}
        b.append("<h2>").append(t.apply("Source-resolved call candidates")).append("</h2><div class=\"scroll\">");for(Object v:arr(impact.get("calls")).stream().limit(500).toList()){var c=obj(v);b.append("<div class=\"chain\"><strong>").append(html(c.get("symbol"))).append("</strong><div>").append(html(c.get("source"))).append(":").append(html(c.get("line"))).append(" → ").append(html(c.get("target"))).append("</div><small>").append(html(c.get("caller"))).append(" · ").append(html(c.get("language"))).append("</small></div>");}
        b.append("</div></section><section class=\"card wide\">").append(I18n.tour(5,lang)).append("<h2>").append(t.apply("Evidence and next steps")).append("</h2>");
        if(r.get("comparison")!=null){b.append("<p>").append(t.apply("Comparison")).append(": ");for(String key:List.of("new","existing","absent"))b.append(t.apply(key)).append(" ").append(num(obj(r.get("comparison")).get(key))).append(" · ");b.append("</p>");}
        for(Object v:arr(r.get("findings"))){var f=obj(v);String evidence=str(f.get("evidence"));b.append("<article class=\"row\"><span class=\"pill\">").append(html(f.get("engine"))).append("</span><span class=\"pill\">").append(t.apply(f.get("priority"))).append("</span>");if(f.get("correlation")!=null)b.append("<span class=\"pill\">").append(t.apply("Same file in impact set")).append("</span>");b.append("<h3>").append(t.apply(f.get("title"))).append("</h3><code>").append(html(f.get("path"))).append(":").append(html(f.get("line"))).append("</code><details><summary>").append(t.apply("Evidence & action")).append("</summary>");
            if(I18n.contains(evidence)||evidence.matches("\\d+ lines"))b.append("<p>").append(t.apply(evidence)).append("</p>");else{b.append("<p class=\"muted\">").append(t.apply("Original source evidence")).append("</p>");if(str(f.get("engine")).equals("impact")){int split=evidence.indexOf(": ");b.append("<code>").append(html(split<0?evidence:evidence.substring(0,split))).append("</code>");if(split>=0)b.append("<p>").append(t.apply(evidence.substring(split+2))).append("</p>");}else b.append("<pre>").append(html(evidence)).append("</pre>");}
            b.append("<p>").append(t.apply(f.get("action"))).append("</p></details></article>");}
        b.append("</section><section class=\"card\"><h2>").append(t.apply("RevScope · analysis guidance")).append("</h2>");for(Object v:arr(r.get("tools"))){var tool=obj(v);b.append("<p><a href=\"").append(html(tool.get("url"))).append("\">").append(html(tool.get("name"))).append("</a> · ").append(t.apply(tool.get("summary"))).append("</p>");}if(arr(r.get("tools")).isEmpty())b.append("<p>").append(t.apply("No matching artifact signal was found.")).append("</p>");
        b.append("<p class=\"muted\">").append(t.apply("Tools are recommendations. No binaries are executed.")).append("</p></section><section class=\"card\">").append(I18n.tour(6,lang)).append("<h2>").append(t.apply("Coverage & limitations")).append("</h2>");for(Object l:arr(r.get("limitations")))b.append("<p class=\"muted\">").append(t.apply(l)).append("</p>");
        b.append("<details><summary>").append(t.apply("Compiler diagnostics and skipped files")).append("</summary><h3>").append(t.apply("Original compiler diagnostics")).append("</h3><pre>").append(html(Json.write(impact.get("warnings")))).append("</pre><h3>").append(t.apply("Skipped files")).append("</h3><pre>").append(html(Json.write(obj(r.get("inventory")).get("skipped")))).append("</pre></details></section></div>").append(PipelineTour.render(r,lang)).append(CatalogView.render(lang)).append(tutorial(lang)).append("<footer>ForgeScope · <a href=\"https://github.com/brunnojob/forgescope\">").append(t.apply("Source & documentation")).append("</a> · ").append(t.apply("Local report · no analytics or remote scripts.")).append("</footer></main></body></html>");return b.toString();
    }
}
