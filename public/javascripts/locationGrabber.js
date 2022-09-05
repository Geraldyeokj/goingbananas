function getLocation() {
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(savePosition);
    } 
}

function savePosition(position) {
    document.getElementById("locationSent").value = "true";
    document.getElementById("latitude").value = position.coords.latitude;
    document.getElementById("longitude").value = position.coords.longitude;
}