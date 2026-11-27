using System.Text;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

namespace ForgeScope.Worker;

public static class Program
{
    static Dictionary<string, object?> M(params object?[] items)
    {
        var d = new Dictionary<string, object?>();
        for (var i = 0; i < items.Length; i += 2) d[(string)items[i]!] = items[i + 1];
        return d;
    }
    public static Dictionary<string, object?> Analyze(IReadOnlyDictionary<string,string> files)
    {
        if(files.Count>10000 || files.Sum(f=>Encoding.UTF8.GetByteCount(f.Value))>20_000_000)
            throw new ArgumentException("C# source inventory exceeds limits");
        var trees=files.Select(f=>CSharpSyntaxTree.ParseText(f.Value,path:f.Key)).ToArray();
        var platform=(string?)AppContext.GetData("TRUSTED_PLATFORM_ASSEMBLIES") ?? "";
        var refs=platform.Split(Path.PathSeparator,StringSplitOptions.RemoveEmptyEntries).Distinct()
            .Select(p=>MetadataReference.CreateFromFile(p));
        var compilation=CSharpCompilation.Create("ForgeScopeAnalysis",trees,refs,
            new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary,allowUnsafe:false));
        var edges=new List<object>();var calls=new List<object>();var symbols=new List<object>();
        var warnings=new List<object>();var unresolved=new List<object>();var dynamicSites=new List<object>();
        var edgeKeys=new HashSet<string>();
        string? Source(ISymbol? symbol)=>symbol?.OriginalDefinition.DeclaringSyntaxReferences.FirstOrDefault()?.SyntaxTree.FilePath;
        foreach(var tree in trees)
        {
            var model=compilation.GetSemanticModel(tree);var root=tree.GetRoot();
            foreach(var n in root.DescendantNodes())
            {
                int line=n.GetLocation().GetLineSpan().StartLinePosition.Line+1;
                var declared=n is BaseTypeDeclarationSyntax or BaseMethodDeclarationSyntax or LocalFunctionStatementSyntax
                    ?model.GetDeclaredSymbol(n):null;
                if(declared is not null)
                    symbols.Add(M("path",tree.FilePath,"name",declared.Name,"qualified_name",declared.ToDisplayString(),"line",line,"kind",declared.Kind.ToString(),"language","csharp"));
                if(n is IdentifierNameSyntax or MemberAccessExpressionSyntax)
                {
                    var symbol=model.GetSymbolInfo(n).Symbol;var target=Source(symbol);
                    if(target is not null && target!=tree.FilePath && edgeKeys.Add(tree.FilePath+":"+line+":"+target))
                        edges.Add(M("source",tree.FilePath,"target",target,"line",line,"import",symbol!.ToDisplayString(),"kind","semantic-reference","language","csharp"));
                }
                if(n is not InvocationExpressionSyntax invocation)continue;
                var resolved=model.GetSymbolInfo(invocation).Symbol;var destination=Source(resolved);
                if(resolved is IMethodSymbol method && destination is not null)
                {
                    var caller=model.GetEnclosingSymbol(n.SpanStart);
                    calls.Add(M("source",tree.FilePath,"target",destination,"line",line,"symbol",method.ToDisplayString(),"caller",caller?.ToDisplayString(),"confidence","source-symbol-resolved","language","csharp"));
                }
                else if(invocation.Expression is MemberAccessExpressionSyntax access)
                {
                    var receiver=model.GetSymbolInfo(access.Expression).Symbol as ITypeSymbol ?? model.GetTypeInfo(access.Expression).Type;
                    var target=Source(receiver);
                    if(target is not null)
                        unresolved.Add(M("path",tree.FilePath,"target",target,"line",line,"symbol",access.ToString(),"confidence","review-required","reason","Call did not resolve against a supplied local C# type. Review overloads, signatures and missing references."));
                }
                var expression=invocation.Expression.ToString();
                if(expression.Contains(".Invoke",StringComparison.Ordinal)||expression is "Type.GetType" or "Activator.CreateInstance")
                    dynamicSites.Add(M("path",tree.FilePath,"line",line,"expression",expression));
            }
        }
        foreach(var d in compilation.GetDiagnostics().Where(d=>d.Severity==DiagnosticSeverity.Error).Take(1000))
            warnings.Add(M("path",d.Location.SourceTree?.FilePath??"","line",d.Location.GetLineSpan().StartLinePosition.Line+1,"reason","C# compiler diagnostic in isolated analysis","code",d.Id,"detail",d.GetMessage(System.Globalization.CultureInfo.InvariantCulture)));
        return M("modules",trees.Length,"edges",edges,"calls",calls,"symbols",symbols,"warnings",warnings,"dynamic_sites",dynamicSites,"unresolved_references",unresolved);
    }
    public static int Main(string[] args)
    {
        Console.InputEncoding=Encoding.UTF8;Console.OutputEncoding=new UTF8Encoding(false);
        try
        {
            if(args.Contains("--self-test"))return SelfTest();
            using var input=new MemoryStream();var chunk=new byte[8192];int count;
            while((count=Console.OpenStandardInput().Read(chunk))>0){if(input.Length+count>25_000_000)throw new ArgumentException("Worker input too large");input.Write(chunk,0,count);}
            using var doc=JsonDocument.Parse(input.ToArray(),new JsonDocumentOptions{MaxDepth=100});
            var files=new Dictionary<string,string>();
            foreach(var f in doc.RootElement.GetProperty("files").EnumerateObject())
            {
                if(!f.Name.EndsWith(".cs",StringComparison.Ordinal)||Path.IsPathRooted(f.Name)||f.Name.Split('/').Contains(".."))throw new ArgumentException("Expected relative C# source paths");
                if(!files.TryAdd(f.Name,f.Value.GetString()??""))throw new ArgumentException("Duplicate source path");
            }
            Console.Write(JsonSerializer.Serialize(Analyze(files)));return 0;
        }
        catch(Exception e){Console.Error.WriteLine("ForgeScope.Worker: "+e.Message);return 2;}
    }
    static int SelfTest()
    {
        int tests=0;
        void Check(bool ok,string name){if(!ok)throw new Exception("Failed: "+name);tests++;}
        var files=new Dictionary<string,string>{["Pricing.cs"]="namespace Shop; public static class Pricing { public static int Total(int p,int q)=>p*q; }",
            ["Orders.cs"]="namespace Shop; public static class Orders { public static int Run()=>Pricing.Total(2,3); }",
            ["Legacy.cs"]="namespace Shop; public static class Legacy { public static int Run()=>Pricing.OldTotal(2,3); }"};
        var r=Analyze(files);var calls=(List<object>)r["calls"]!;var unresolved=(List<object>)r["unresolved_references"]!;
        Check(calls.Count==1,"resolved method call");Check(unresolved.Count==1,"missing local member");
        Check(((List<object>)r["warnings"]!).Count>0,"compilation uncertainty visible");
        Check(((List<object>)r["edges"]!).Count>0,"semantic dependency");
        var shadow=Analyze(new Dictionary<string,string>{["A.cs"]="class A { public static void Run() {} }",
            ["B.cs"]="class B { static void Caller(System.Action A) { A(); } }"});
        Check(((List<object>)shadow["calls"]!).Count==0,"parameter shadows source type");
        Check(((List<object>)shadow["unresolved_references"]!).Count==0,"no invented member failure");
        var overload=Analyze(new Dictionary<string,string>{["A.cs"]="class A { public static void Run(int n) {} public static void Run(string n) {} }",
            ["B.cs"]="class B { static void Caller() { A.Run(1); A.Run(\"x\"); } }"});
        Check(((List<object>)overload["calls"]!).Count==2,"overload calls resolved");
        Check(((List<object>)overload["warnings"]!).Count==0,"valid isolated source");
        Console.WriteLine($"C# Roslyn worker: {tests} checks passed");return 0;
    }
}
