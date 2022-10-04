const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const glob = require('glob');

import {
  PackageCache,
  BuildTarget,
  Package,
  Snapshot,
  Manifest,
  submitSnapshot
} from '@github/dependency-submission-toolkit'

async function run() {
  let manifests = getManifestsFromSpdxFiles(searchFiles());
  
  let snapshot = new Snapshot({
      name: "spdx-to-dependency-graph-action",
      version: "0.0.1",
      url: "https://github.com/jhutchings1/spdx-to-dependency-graph-action",
  }, 
  github.context,
  {
    correlator:`${github.context.job}`,
    id: github.context.runId.toString()
  });

  manifests?.forEach(manifest => {
    snapshot.addManifest(manifest);
  });

  submitSnapshot(snapshot);
}

function getManifestFromSpdxFile(document, fileName) {
  core.debug(`getManifestFromSpdxFile processing ${fileName}`);

  let manifest = new Manifest(document.name, fileName);
  //core.debug(`Processing ${JSON.stringify(document)}`);
  core.debug(`Processing ${document.packages?.length}`);
  document.packages?.forEach(pkg => {
    let packageName = pkg.packageName;
    let packageVersion = pkg.packageVersion;
    let purl = pkg.purl;
    /*let relationships = document.relationships?.find(rel => rel.relatedSpdxElement == pkg.SPDXID && rel.relationshipType == "DEPENDS_ON" && rel.spdxElementId != "SPDXRef-RootPackage");
    if (relationships.length > 0) {
        manifest.addIndirectDependency(new Package(packageName, packageVersion, purl, new BuildTarget(rel.spdxElementId)));
    } else {
        manifest.addDirectDependency(new Package(packageName, packageVersion, purl, new BuildTarget(rel.spdxElementId)));
      }*/
    });
    return manifest;
}

function getManifestsFromSpdxFiles(files) {
  core.debug(`Processing ${files.length} files`);
  let manifests = [];
  files?.forEach(file => {
    core.debug(`Processing ${file}`);
    manifests.push(getManifestFromSpdxFile(JSON.parse(fs.readFileSync(file)), file));
  });
  return manifests;
}

function searchFiles() {
  let filePath = core.getInput('filePath');
  let filePattern = core.getInput('filePattern');

  return glob.sync(`${filePath}/${filePattern}`, {});
}

run();
