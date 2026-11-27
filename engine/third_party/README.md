# Third-party provenance

The original MIT notices for PatchScope, CIFuse, RepoRelief, DevRescue and RevScope are retained in `licenses/`. Exact source commits and integration modes are recorded in `src/main/resources/provenance.json`.

Version 0.3 ports review logic into Java; it does not execute the original JavaScript engines. The RevScope JSON catalog remains a snapshot. Rule wording and finding fingerprints can differ from version 0.2.

SQLite history uses Xerial SQLite JDBC 3.54.1.0 (Apache-2.0 / BSD components; see https://github.com/xerial/sqlite-jdbc/blob/master/LICENSE) and SLF4J API 1.7.36 (MIT; https://www.slf4j.org/license.html). These dependencies are fetched only by an explicit build step or Maven, not during scans. The JARs preserve their embedded license notices. Download URLs and pinned SHA-256 digests are in `tools/Dependencies.java`.

The C# worker references Roslyn assemblies distributed with the installed .NET SDK (MIT; https://github.com/dotnet/roslyn/blob/main/License.txt). No target-project MSBuild evaluation, analyzers or source generators are loaded.
