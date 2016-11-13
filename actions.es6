$(function() {

  require("babel-polyfill");

  const fs = require("fs");
  const unzip = require("unzip");
  const Promise = require("bluebird");
  const path = require("path");
  const http = require("http");

  const exec = require('child_process').exec;

  let acceptableExtensions = [".srt"];
  let extractTo = path.join(process.env.HOME, "Desktop");
  let defaultEditor = "/usr/local/bin/subl";

  $("#clear").click(function(e) {
    e.preventDefault();
    $("#showName").val("")
    $("#seasonNumber").val("")
    $("#episodeNumber").val("")
    $("#language").val("all")
    // $("#editor").is(":checked")
    $(".results").empty()
  })

  function openInEditor() {
    return $("#editor").is(":checked")
  }

  function generateListEntry(result) {
    return $(`<li class="list-group-item">
      <div class="media-body">
        <strong>${result.Title} - ${result.Releases.join(" ")}</strong>
        <p>${result.Language}</p>
      </div>
    </li>`);
  }

  function performRequest(url) {
    let p = new Promise((resolve, reject) => {
      http.get(url, (response) => {
        resolve(response);
      }).on('error', (err) => {
        reject(err);
      })
    })
    return p;
  }

  async function addSearchResults(results) {
    let $list = $(".results")
    $list.empty()
    results.forEach(result => {
      let item = generateListEntry(result);

      item.attr("data-obj", JSON.stringify(result))

      $list.append(item);

      item.dblclick(async function() {
        let obj = JSON.parse(item.attr("data-obj"))
        let url = obj.URL;
        setStatus(`requesting ${url}`)

        try {
          let response = await performRequest(url)
          response.pipe(unzip.Parse()).on('entry', (entry) => {
              handleZipEntry(entry)
          })
        } catch(err) {
          setStatus("error:" + err.message)
        }
      })
    })
  }

  function handleZipEntry(entry) {
    let fileName = entry.path;
    let type = entry.type; // 'Directory' or 'File'
    let size = entry.size;
    let interestingExtension =
      acceptableExtensions.filter(ext => fileName.toLowerCase().endsWith(ext))

    if(interestingExtension.length > 0) {
      let outputDestination = path.join(extractTo, fileName)
      setStatus(`Extracting to ${outputDestination}`)

      entry.pipe(fs.createWriteStream(outputDestination))
        .on("finish", async () => {
          if(openInEditor()) {
            let openString = `${defaultEditor} "${outputDestination}"`;
            setStatus(`Opening editor ${defaultEditor}`)
            try {
              await execProcess(openString)
              setStatus("Done")
            } catch(err) {
              setStatus(`Error: ${err.message}`)
            }
          }
        });
    }
    entry.autodrain();
  }

  function setStatus(text) {
    console.log(text)
    $(".status").text(text)
  }

  function getSearchParams() {
    let showName = $("#showName").val()
    let seasonNumber = $("#seasonNumber").val()
    let episodeNumber = $("#episodeNumber").val()
    let language = $("#language").val()
    let editor = $("#editor").is(":checked")
    return {
      showName: showName, seasonNumber: seasonNumber,
      language: language, episodeNumber: episodeNumber,
      editor: editor
    }
  }

  let gosubsBin = path.join(process.env.HOME, "bin/gosubs")

  function execProcess(command) {
    let p = new Promise((resolve,reject) => {
      exec(command, (err, stdout, stderr) => {
        if(err) {
          reject(err)
        } else {
          return resolve({stdout:stdout,stderr:stderr})
        }
      })
    })
    return p
  }

  async function searchSubtitles(subtitleParams) {
    const {editor, episodeNumber, language, seasonNumber, showName} = subtitleParams;
    let execCommand = `${gosubsBin} -format json -name "${showName}" -language ${language} `
    if(seasonNumber !== "") {
      execCommand += `-season ${seasonNumber} `
    }
    if(episodeNumber !== "") {
      execCommand += `-episode ${episodeNumber} `
    }

    setStatus(`Searching for subtitles for ${showName}`)

    try {
      let res = await execProcess(execCommand)
      let {stdout, stderr} = res;
      let subtitles = JSON.parse(stdout)
      setStatus("Populating subtitles")
      await addSearchResults(subtitles);
    } catch(err) {
      setStatus(`Error:${err.message}`)
    }

  }

  $(".sub-searcher").submit(async function(e) {
    e.preventDefault()
    let params = getSearchParams()
    await searchSubtitles(params)
  })
})
