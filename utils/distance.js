export function getDistanceKm(coordA, coordB) {
  const R = 6371; // radius of Earth in km

  const dLat = (coordB.lat - coordA.lat) * Math.PI/180;
  const dLng = (coordB.lng - coordA.lng) * Math.PI/180;

  const lat1 = coordA.lat * Math.PI/180;
  const lat2 = coordB.lat * Math.PI/180;

  const a =
    Math.sin(dLat/2) ** 2 +
    Math.sin(dLng/2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // distance in km
}