// JSONを木に変換

function createNode(key,value){


  const container=document.createElement("div");
  container.className="ast-node";


  const label=document.createElement("span");
  label.className="ast-label";


  label.textContent=key;


  container.appendChild(label);



  if(
    typeof value !== "object"
    || value===null
  ){

    const text=document.createElement("span");

    text.className="ast-value japanese-text";


    if(key==="text"){

        const keyPart=document.createElement("span");
        keyPart.className="ast-value japanese-text";
        keyPart.textContent=": ";

        const wordPart=document.createElement("span");
        wordPart.className="gule-word";
        wordPart.textContent=value;

        container.appendChild(keyPart);
        container.appendChild(wordPart);

        return container;
    }


    text.textContent=": "+value;

    container.appendChild(text);

    return container;

  }



  const children=document.createElement("div");

  children.className="ast-children";


  container.appendChild(children);



  label.onclick=()=>{

    children.classList.toggle(
      "ast-hidden"
    );

  };



  for(const k in value){

    children.appendChild(
      createNode(
        k,
        value[k]
      )
    );

  }


  return container;

}





function showAST(json){

 const view = document.getElementById("ast-view");

 // 前回の表示を削除
 view.innerHTML = "";


 const root =
 createNode(
  "解析結果",
  json
 );


 view.appendChild(root);

}
