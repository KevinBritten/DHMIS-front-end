const CONTRACT_ADDRESS = '0x218b3ffB9E8c7ae58D3f6dE5F1887c14BFFF1b8a';

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageURI: characterData.imageURI,
    hp: characterData.hp.toNumber(),
    hpMod: characterData.hpMod.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    attackDamage: characterData.attackDamage.toNumber(),
    attackDamageMod: characterData.attackDamageMod.toNumber(),
    criticalChance: characterData.criticalChance.toNumber()
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
