'use client'

import Image from "next/image";
import { Button } from "@mui/material";
import { useState } from "react";

export default function Home() {
  const [hasError, setError] = useState(false)
  const [errMessage, setErrMessage] = useState("")
  const [chubFileName, setChubName] = useState("")
  const [chubData, setChubData] = useState("")

  const downloadFile = async() => {
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

  const readFunct = async(file) => 
  {
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
  
  const convertData = async(event) => {
    const file = event.target.files[0]

    if(!file)
    {
      setErrMessage("Error converting: seems I can't open the file.")
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

    setChubName("CHUB_" + file.name)

    let text = ""
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

    let chubData = {}

    let chubJson = {spec: "chara_card_v2", spec_version: "2.0", data: chubData};
     
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


    setError(false)
    setErrMessage("")

    setChubData(chubJson)

    console.log("file name: " + file.name);
  }
  
  return (
    <div className="grid items-center justify-items-center">
      <p>NOTE: you will have to put in the tagline and creator's notes yourself; as far as I know, Chub can't let you import that</p>
      <br></br>
      <p>Currently this can convert xouls and lorebooks to the right format. Apologies for the bad UI I don't like doing frontend stuff.</p>
      <br></br>
      <p>Drop Your Json File Here:</p>
      <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
        Upload File
        <input type="file" accept=".json" className="hidden" onChange={convertData}/>
      </label>
      <br></br>
      {hasError ? (<p>ERROR: {errMessage}</p>) : (<p></p>)}
      {chubData != "" ? (
        <div>
          <p>File Ready! Click here To Download:</p>
          <Button variant="contained" color="error" onClick={downloadFile}>Download New File For Chub</Button>
        </div>
        ) : (<p></p>)}
    </div>
  );
}
