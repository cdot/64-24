/* global ClipboardItem, URLSearchParams, URL */
let signatures;
let expanded;
let picked = -1;
let curSig;

function nextSignature(force) {
  if (/^\d+$/.test(force))
    picked = parseInt(force);
  else
    picked = (picked + 1) % signatures.length;
  console.debug("picked", picked);
  curSig = signatures[picked];
  document.getElementById("template_name").textContent = curSig.id;
  update();
}

function lastSignature() {         
  if (picked === 0)
    picked = signatures.length - 1;
  else
    picked--;
  curSig = signatures[picked];
  document.getElementById("template_name").textContent = curSig.id;
  update();
}

function update() {
  const fields = document.querySelectorAll(".field");
  let html = curSig.innerHTML;
  for (const field of fields) {
    const name = field.id;
    let text = field.value;
    if (field.type === "url") {
      // Make field_url from field, so e.g. website (which is type url) also expands website_url
      if (!/^\w+:/.test(text))
        text = "http://" + text;
      const url = URL.parse(text);
      if (url) {
        text = url.hostname;
        html = html.replaceAll(`\$\{${name}_url\}`, url.href);
      }
    }
    html = html.replaceAll(`\$\{${name}\}`, text);
  }
  expanded.innerHTML = html;
}

function copyToClipboard() {
  if (location.protocol !== 'https:') {
    alert("Cannot copy to clipboard, https required");
  } else {
    const clipboardItemData = {
      ["text/plain"]: expanded.innerHTML.replaceAll(/\s\s+/g, " ")
    };
    const clipboardItem = new ClipboardItem(clipboardItemData);
    navigator.clipboard.write([clipboardItem])
    .then(() => {
      alert("Copied to clipboard");
    });
  }
}

async function fetch_sig(id) {
  return fetch(`sigs/${id}.html`)
  .then(response => {
    if (!response.ok)
      throw new Error(response.status);
    return response.text();
  })
  .then(text => {
    const sig = document.createElement("div");
    sig.classList.add("signature");
    sig.classList.add("hidden");
    sig.id = id;
    sig.innerHTML = text;
    document.querySelector("body")
    .appendChild(sig);
  });
}

async function begin() {
  let i = 0;
  while (i >= 0) {
    await fetch_sig(i)
    .then(() => i++)
    .catch(() => i = -1);
  } 
  expanded = document.getElementById("expanded");
  signatures = document.querySelectorAll(".signature");
  let button = document.getElementById("switch");
  button.addEventListener("click", nextSignature);
  button = document.getElementById("switchback");
  button.addEventListener("click", lastSignature);
  button = document.getElementById("copy");
  button.addEventListener("click", copyToClipboard);
  const fields = document.querySelectorAll(".field");
  for (const field of fields) {
    button.addEventListener("change", update);
  }
  const urlParams = new URLSearchParams(window.location.search);
  nextSignature(urlParams.get("sig"));
}
