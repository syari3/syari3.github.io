var partsTable = {
  image1 : "s",
  image2 : "ms",
  image3 : "hs",
  image4 : "ts",
  image5 : "ns",
  image6 : "ss",
  image7 : "m",
  image8 : "w",
  image9 : "u",
  image10: "o",
  image11: "z",
  image12: "l",
}

function nowParts() {
  var nowParts = [];
  for (var i = 1; i <= 12; i++) {
    if (id("image" + i).style.display == "block") {
      nowParts.push(partsTable["image" + i]);
    }
  }
  return nowParts;
}

function getCorrectPart(part, parts) {
  switch (part) {
    case "o": 
      if (parts.includes("ss")) {
        return "o2";
      } else if (parts.includes("ts")) {
        return "o3";
      } else {
        return "o1";
      }
    case "z":
      if (parts.includes("ss")) {
        return "z2";
      } else if (parts.includes("ts")) {
        return "z3";
      } else {
        return "z1";
      }
    case "l":
      if (parts.includes("s")) {
        return "l2";
      } else {
        return "l";
      }
    default:
      return part;
  }
}

function search() {
  const syariRadio = document.getElementById("syari-radio");
  const readingRadio = document.getElementById("reading-radio");
  const japaneseRadio = document.getElementById("japanese-radio");
  if (syariRadio.checked) {
    searchParts();
  } else if (readingRadio.checked) {
    searchReading();
  } else if (japaneseRadio.checked) {
    searchJapanese();
  }
}

async function searchParts() {
  var parts = nowParts().join("-");
  if(parts == []) {
    dialog("少なくとも一つのパーツを入力してください。");
    return;
  }
  var url = "https://syari-api.onrender.com/search/parts/" + parts;
  console.log(typeof(parts));
  console.log(url);

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);

    if(data.length > 0) {
      dialog(`${data.length}個のデータが見つかりました。`);
    } else {
      dialog("該当するデータは見つかりませんでした。");
    }

    // Clear existing content
    document.getElementById('result-container').innerHTML = '';
    var result = document.createElement('div');
    if (data.length > 0) {
      result.textContent = `${data.length}個のデータが見つかりました。`;
    } else {
      result.textContent = `該当するデータは見つかりませんでした。`;
    }
    document.getElementById('result-container').appendChild(result);

    // Create HTML elements for each item in the data
    data.forEach(item => {
      const key = item[0]; // Get the key from the item
      const container = document.createElement('div');
      container.className = 'item-container container';
      const yomiElement = document.createElement('span');
      yomiElement.textContent = `読み方: ${item[1].yomi}`;
      const imiElement = document.createElement('span');
      imiElement.textContent = `意味: ${item[1].imi}`;
      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      item[1].parts.forEach(part => {
        const image = document.createElement('img');
        image.id = part + key; // Use part and key for IDs
        var partName = getCorrectPart(part, item[1].parts);
        image.setAttribute("src", "/bigimg/" + partName + "@8x.png");
        image.className = 'result-image';
        imageContainer.appendChild(image);
      });
      // Create clickable link
      const link = document.createElement('a');
      link.textContent = "詳細を見る";
      link.href = `/search/word/${key}`;
      // fullがokであるか確認
      if (item[1].full && item[1].full === "ok") {
        container.appendChild(link);
      }
      container.appendChild(imageContainer);
      container.appendChild(yomiElement);
      container.appendChild(imiElement);
      document.getElementById('result-container').appendChild(container);
    });
  } catch (err) {
    console.error("Error parsing JSON string:", err);
  }
}

async function searchReading() {
  const inputValue = document.getElementById("reading-input").value.trim();
  const filename = 'https://syari-api.onrender.com/data'; // エンドポイントを更新

  try {
    const response = await fetch(filename);

    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const jsonData = await response.json();
    const results = Object.entries(jsonData).filter(([key, value]) => value.yomi.includes(inputValue));
    // Sort results by length of 'yomi'
    results.sort((a, b) => a[1].yomi.length - b[1].yomi.length);

    if(results.length > 0) {
      dialog(`${results.length}個のデータが見つかりました。`)
    } else {
      dialog("該当するデータは見つかりませんでした。")
    }

    // Clear existing content
    document.getElementById('result-container').innerHTML = '';
    const resultMessage = document.createElement('div');
    if (results.length > 0) {
      resultMessage.textContent= `${results.length}個のデータが見つかりました。`
    } else {
      resultMessage.textContent= `該当するデータは見つかりませんでした。`
    }
    document.getElementById('result-container').appendChild(resultMessage);

    // Create HTML elements for each item in the results
    results.forEach(([key, item], index) => {
      const container = document.createElement('div');
      container.className = 'item-container container';
      const yomiElement = document.createElement('span');
      yomiElement.textContent = `読み方: ${item.yomi}`;
      const imiElement = document.createElement('span');
      imiElement.textContent = `意味: ${item.imi}`;

      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      item.parts.forEach(part => {
        const image = document.createElement('img');
        image.id = `result-image-${index}-${part}`;
        var partName = getCorrectPart(part, item.parts);
        image.setAttribute("src", "/bigimg/" + partName + "@8x.png");
        image.className = 'result-image';
        imageContainer.appendChild(image);
      });

      // クリック可能なリンク作成
      const link = document.createElement('a');
      link.textContent = "詳細を見る";
      link.href = `/search/word/${key}`;

      // fullがokであるか確認
      if (item.full && item.full === "ok") {
        container.appendChild(link);
      }
      
      container.appendChild(imageContainer);
      container.appendChild(yomiElement);
      container.appendChild(imiElement);
      document.getElementById('result-container').appendChild(container);
    });
  } catch (error) {
    console.error("Error fetching or parsing data.json", error);
  }
}

async function searchJapanese() {
  const inputValue = document.getElementById("syari-japanese-input").value.trim();
  const filename = 'https://syari-api.onrender.com/data'; // エンドポイントを更新

  try {
    const response = await fetch(filename);

    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const jsonData = await response.json();
    const results = Object.entries(jsonData).filter(([key, value]) => value.imi.includes(inputValue));
    // Sort results by length of 'yomi'
    results.sort((a, b) => a[1].imi.length - b[1].imi.length);

    if(results.length > 0) {
      dialog(`${results.length}個のデータが見つかりました。`)
    } else {
      dialog("該当するデータは見つかりませんでした。")
    }

    // Clear existing content
    document.getElementById('result-container').innerHTML = '';
    const resultMessage = document.createElement('div');
    if (results.length > 0) {
      resultMessage.textContent= `${results.length}個のデータが見つかりました。`
    } else {
      resultMessage.textContent= `該当するデータは見つかりませんでした。`
    }
    document.getElementById('result-container').appendChild(resultMessage);

    // Create HTML elements for each item in the results
    results.forEach(([key, item], index) => {
      const container = document.createElement('div');
      container.className = 'item-container container';
      const yomiElement = document.createElement('span');
      yomiElement.textContent = `読み方: ${item.yomi}`;
      const imiElement = document.createElement('span');
      imiElement.textContent = `意味: ${item.imi}`;

      const imageContainer = document.createElement('div');
      imageContainer.className = 'image-container';
      item.parts.forEach(part => {
        const image = document.createElement('img');
        image.id = `result-image-${index}-${part}`;
        var partName = getCorrectPart(part, item.parts);
        image.setAttribute("src", "/bigimg/" + partName + "@8x.png");
        image.className = 'result-image';
        imageContainer.appendChild(image);
      });
      // クリック可能なリンク作成
      const link = document.createElement('a');
      link.textContent = "詳細を見る";
      link.href = `/search/word/${key}`;

      // fullがokであるか確認
      if (item.full && item.full === "ok") {
        container.appendChild(link);
      }
      
      container.appendChild(imageContainer);
      container.appendChild(yomiElement);
      container.appendChild(imiElement);
      document.getElementById('result-container').appendChild(container);
    });
  } catch (error) {
    console.error("Error fetching or parsing data.json", error);
  }
}