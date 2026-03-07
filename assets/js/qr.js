
function showQR(src) {
  const overlay = document.getElementById("qr-overlay");
  const img = document.getElementById("qr-image");

  img.src = src;
  overlay.style.display = "flex";
}

function hideQR() {
  document.getElementById("qr-overlay").style.display = "none";
}
