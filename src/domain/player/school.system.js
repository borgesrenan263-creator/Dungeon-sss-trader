const schools = [
  "Knight",
  "Mage",
  "Hunter"
];

const playerSchools = new Map();

function chooseSchool(playerId, school) {

  if (!schools.includes(school)) {
    return { ok:false };
  }

  playerSchools.set(playerId, school);

  return {
    ok:true,
    school
  };

}

function getPlayerSchool(playerId){
  return playerSchools.get(playerId);
}

module.exports = {
  chooseSchool,
  getPlayerSchool,
  schools
};
