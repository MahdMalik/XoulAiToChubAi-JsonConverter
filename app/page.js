'use client'

import Image from "next/image";
import { Button, TextField } from "@mui/material";
import { useState } from "react";

export default function Home() {  
  const [hasError, setError] = useState(false)
  const [errMessage, setErrMessage] = useState("")
  const [chubFileName, setChubName] = useState("")
  const [chubData, setChubData] = useState("")
  const [recursiveScan, setRecursiveScan] = useState(false)
  const [numEntries, setNumEntries] = useState(3)
  const [numScanned, setScanCount] = useState(3)

  //this is the max, because xoul allowed at most 1500 characters, which 400 tokens should cover as numChars / 4 is about the # of tokens
  const tokensPerLorebookEntry = 400;

  //function to download the json file
  const downloadFile = async() => {
    //set data and type of file
    const blob = new Blob([chubData], {type: "text/plain"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a');
    a.href = url;
    a.download = chubFileName;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  //reads the file uploaded by the user
  const readFunct = async(file) => 
  {
    //use this so we can await it being read
    return new Promise((resolve, reject) => 
    {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result); // resolves with the file content
      };

      reader.onerror = () => {
        reject(reader.error); // rejects with the error
      };

      reader.readAsText(file);
    });
  }

  //converts specifically a json for a xoul
  const convertXoul = async(xoulJson) => {
    let chubData = {}

    //not sure if we need spec and spec_version, but just in case
    let chubJson = {spec: "chara_card_v2", spec_version: "2.0", data: chubData};
     
    //just doing the correct mappings here

    chubData.name = xoulJson.name
    //chub combines both these sectinons
    chubData.description = xoulJson.backstory + "\n\n\n" + xoulJson.definition
    chubData.first_mes = xoulJson.greeting
    chubData.mes_example = xoulJson.samples

    //I think this is right?
    chubData.creator_notes = xoulJson.bio
    //this may not end up returning the correct corresponding tags, so you'll
    //likely have to re-input your tags
    chubData.tags = xoulJson.social_tags

    //lets hope this works lol
    chubData.tagline = xoulJson.tagline

    console.log(chubJson)

    //convert this back into json format
    chubJson = JSON.stringify(chubJson)

    console.log(chubJson)

    //set it to the new data
    setChubData(chubJson)

  }

  //specifically converts a lorebook to the right format
  const convertLorebook = async(xoulJson) => {
    let chubEntries = {}
    //set the initial stuff. Again, tokenBudget = numEntires * tokensPerEntry
    let chubJson = {name: xoulJson.name, description: xoulJson.description, is_creation: false, scan_depth: numScanned, 
      token_budget: tokensPerLorebookEntry * Number(numEntries), recursive_scanning: recursiveScan, entries: chubEntries};

    //this holds the array of all entries from the xoul json
    const entryArray = xoulJson.embedded.sections

    //for each entry in the xoul entry array, add them to chub's version. note that chub uses an object where the key is the index,
    //rather than an array for the entries.
    entryArray.map((element, index) => {
      chubEntries[index + 1] =  {uid: index + 1, case_sensitive: false, name: element.name, comment: element.name, 
        content: element.text, disable: false, enabled: true, id: index + 1, key: element.keywords, keys: element.keywords,
      probability: 100, selective: false}
    })

    console.log(chubJson)
    
    //convert this back into json format
    chubJson = JSON.stringify(chubJson)

    console.log(chubJson)

    //set it as the new data to download
    setChubData(chubJson)
  }
  
  //overall handler function to convert data
  const convertData = async(event) => {
    const file = event.target.files[0]

    //makes sure what was uploaded is valid
    if(!file)
    {
      setErrMessage("Error converting: seems I can't open the file. My fault og")
      setError(true);
      return;
    }

    //first split by periods, get the last line after the period to get hte extension
    const extension = file.name.split(".").pop().toLowerCase();
    if(extension != "json")
    {
      setErrMessage("Plz submit a valid json file")
      setError(true)
      return
    }
    //just going to set this name to distinguish it from the file that was uploaded while specifying which
    //xoul / lorebook it was for
    setChubName("CHUB_" + file.name)

    let text = ""
    //try to read, if unable to give error
    try
    {
      text = await readFunct(file);
    }
    catch(error)
    {
      setErrMessage("Error parsing the file: " + error)
      return;
    }

    //this is the xoul parsed and stuff into an object. Now the fun begins!
    const xoulJson = JSON.parse(text);
    console.log(xoulJson);

    //check if its a lorebook by if it has the following matches. I don't really have error checking if they upload a different json
    const isLorebook = xoulJson.embedded != null && xoulJson.embedded.asset_type != null && xoulJson.embedded.asset_type == "lorebook"

    if(isLorebook)
    {
      convertLorebook(xoulJson)
    }
    else
    {
      convertXoul(xoulJson);
    }
    console.log("file name: " + file.name);

    setError(false)
    setErrMessage("")
  }
  
  return (
    <div className="grid items-center justify-items-center gap-y-3">
      <div className="flex-vertical items-center justify-items-center">
        <p>NOTE: you have to do it one xoul/lorebook at a time. I unfortunately dont have time to code it to take a folder and automatically
          parse all xouls and lorebooks. Feel free to fork this if you want to do that.</p>
        <a href="https://github.com/MahdMalik/XoulAiToChubAi-JsonConverter" className="text-blue-500">Heres A Link To The Github</a>
      </div>

      <p>NOTE 2: for the xouls, you will have to put in the tagline and creator notes yourself; as far as I know, Chub cant let you import that</p>
      <p>Additionally, for lorebooks you have to put in the lorebook name and description yourself, its for some reason not imported. Also,
        for some reason the scan-depth and token budget dont get imported so that has to be put in manually.
      </p>
      <br></br>
      <p>Currently this can convert xouls and lorebooks to the right format. Apologies for the bad UI I dont like doing frontend stuff.</p>
      <br></br>

      <div className="flex items-center gap-x-2">
        {/* Input field for if recursive scan is enabled or not */}
        <input type="checkbox" id="recursiveCheck" checked={recursiveScan} onClick={() => {setRecursiveScan(!recursiveScan)}}/>
        <label htmlFor="recursiveCheck">Enable Recursive Scan for Lorebooks (chub doesnt have it yet tho)</label>
      </div>

      <div className="flex items-center gap-x-2">
         {/* Input field that will be used for token budget, by doing tokenBudget = lorebookEntries * tokensPerEntry */}
        <p>Put in the max number of lorebook entries youd like to have in memory at the same time (probably not over 10) [THIS NO WORKY!!]: </p>
        <TextField size="small" placeholder="Number of Entries" value={numEntries} onChange={(e) => {
          const newCount = e.target.value
          //checking if it's a valid number or empty
          if(newCount === "" || (newCount * 100 > 10 && newCount.indexOf(".") === -1))
          {
            setNumEntries(newCount)
          }
          else
          {
            alert("Put in a valid value bro")
          }}}/>
      </div>

      <div className="flex items-center gap-x-2">
         {/* Input field for scan depth */}
        <p>Put in the scan depth (how many messages from the most recent it scans for lorebook entries)  [THIS NO WORKY!!]: </p>
        <TextField size="small" placeholder="Number of Messages Scanned" value={numScanned} onChange={(e) => {
          const newScanCount = e.target.value
          //checking if it's a valid number or empty
          if(newScanCount === "" || (newScanCount * 100 > 10 && newScanCount.indexOf(".") === -1))
          {
            setScanCount(newScanCount)
          }
          else
          {
            alert("Put in a valid value bro")
          }}}/>
      </div>

      <br></br>
      <p>Drop Your Json File Here:</p>
      <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
        Upload File
        <input type="file" accept=".json" className="hidden" onChange={convertData}/>
      </label>
      <br></br>
       {/* If there's an error, should show that */}
      {hasError ? (<p>ERROR: {errMessage}</p>) : (<p></p>)}
       {/* If we have results, show them now and the file name that will be downloaded */}
      {chubData != "" ? (
        <div className="grid items-center justify-items-center">
          <p>File Ready for {chubFileName}! Click here To Download:</p>
          <br></br>
          {/* When they click the button, let them download the file*/}
          <Button variant="contained" color="error" onClick={downloadFile}>Download New File For Chub</Button>
        </div>
        ) : (<p></p>)}
    </div>
  );
}
