const CONTRACT_ADDRESS = "0xA9ecF2Ff48B239566eCaC80DaeF1373D0AF22041";

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageURI: characterData.imageURI,
    hp: characterData.hp.toNumber(),
    hpMod: characterData.hpMod.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    attackDamage: characterData.attackDamage.toNumber(),
    attackDamageMod: characterData.attackDamageMod.toNumber(),
    criticalChance: characterData.criticalChance.toNumber(),
  };
};

const transformCharacterDataBoss = (characterData) => {
  return {
    name: characterData.name,
    imageURI: characterData.imageURI,
    hp: characterData.hp.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    attackDamage: characterData.attackDamage.toNumber(),
  };
};

export { CONTRACT_ADDRESS, transformCharacterData, transformCharacterDataBoss };
