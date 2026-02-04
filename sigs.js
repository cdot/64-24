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
  const optionals = document.querySelectorAll("[data-optional]");
  for (const opt of optionals) {
    if (typeof opt.dataset.display === "undefined")
      // Cache the setting of CSS "display"
      opt.dataset.display = (opt.style.display || "");
    opt.style.display = opt.dataset.display;
  }

  const fields = document.querySelectorAll(".field");
  for (const field of fields) {
    let text = field.value;
    const name = field.id;
    // Check it has a value and if it has a checkbox that it's ticked
    const include = document.getElementById(`include_${name}`);
    if ((include && !include.checked) || !text || text === "") {
      // if it's data-optional, hide it
      const optional = curSig.querySelectorAll(`[data-optional=${name}]`);
      for (const opt of optional)
        opt.style.display = "none";
    }
  }

  let html = curSig.innerHTML;
  for (const field of fields) {
    const name = field.id;
    let text = field.value;
    if (field.type === "url") {
      // Make <field>_url from field, so e.g. website (which is type url)
      // also expands website_url
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

function copyToClipboard(html) {
  if (location.protocol !== 'https:') {
    alert("Cannot copy to clipboard, https required");
  } else {
    const html = '<html><meta charset="utf-8"><body>'
          + expanded.innerHTML.replaceAll(/\s\s+/g, " ")
          + "</body></html>";
    const clipboardItemData = {
      ["text/plain"]: html
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

function micro_fuck(html) {
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

  button = document.getElementById("copy_html");
  button.addEventListener("click", copyToClipboard);

  const fields = document.querySelectorAll(".field");
  for (const field of fields)
    field.addEventListener("change", update);

  const switches = document.querySelectorAll("input[type=checkbox]");
  for (const sw of switches)
    sw.addEventListener("change", update);

  const helps = document.querySelectorAll(".help_me");
  for (const button of helps) {
    button.addEventListener("click", function() {
      const curr = document.querySelector(".shown");
      if (curr) {
        curr.classList.add("hidden");
        curr.classList.remove("shown");
      }
      const next = document.getElementById(`${this.name}_help`);
      next.classList.add("shown");
      next.classList.remove("hidden");
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  nextSignature(urlParams.get("sig"));
}
