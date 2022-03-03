import React, { useEffect, useState } from "react";
import "./SelectCharacter.css";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import DHMISGame from "../../utils/DHMISGame.json";

const SelectCharacter = ({ setCharacterNFT }) => {
  const [characters, setCharacters] = useState([]);
  const [gameContract, setGameContract] = useState(null);
  const [mintingState, setMintingState] = useState("");
  const [mintedCharacter, setMintedCharacter] = useState(0);

  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        DHMISGame.abi,
        signer
      );

      /*
       * This is the big difference. Set our gameContract in state.
       */
      setGameContract(gameContract);
    } else {
      console.log("Ethereum object not found");
    }
  }, []);
  useEffect(() => {
    const getCharacters = async () => {
      try {
        console.log("Getting contract characters to mint");

        /*
         * Call contract to get all mint-able characters
         */
        const charactersTxn = await gameContract.getAllDefaultCharacters();
        console.log("charactersTxn:", charactersTxn);

        /*
         * Go through all of our characters and transform the data
         */
        const characters = charactersTxn.map((characterData) =>
          transformCharacterData(characterData)
        );

        /*
         * Set all mint-able characters in state
         */
        setCharacters(characters);
      } catch (error) {
        console.error("Something went wrong fetching characters:", error);
      }
    };
    const onCharacterMint = async (sender, tokenId, characterIndex) => {
      console.log(
        `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
      );
      if (gameContract) {
        const characterNFT = await gameContract.checkIfUserHasNFT();
        console.log("CharacterNFT: ", characterNFT);
        setCharacterNFT(transformCharacterData(characterNFT));
      }
    };

    const onRandomNumberRequested = (sender, characterId) => {
      console.log(
        "Random Number Requested by %s to generate character %s",
        sender,
        characterId
      );
    };
    /*
     * If our gameContract is ready, let's get characters!
     */
    if (gameContract) {
      getCharacters();

      /*
       * Setup NFT Minted Listener
       */
      gameContract.on("CharacterNFTMinted", onCharacterMint);
      gameContract.on("RandomNumberRequested", onRandomNumberRequested);
    }

    return () => {
      /*
       * When your component unmounts, let;s make sure to clean up this listener
       */
      if (gameContract) {
        gameContract.off("CharacterNFTMinted", onCharacterMint);
        gameContract.off("RandomNumberRequested", onRandomNumberRequested);
      }
    };
  }, [gameContract]);
  // Actions
  const mintCharacterNFTAction = (characterId) => async () => {
    try {
      if (gameContract) {
        console.log("Minting character in progress...");
        setMintingState("minting");
        setMintedCharacter(characterId);
        console.log(mintingState, mintedCharacter, characterId);
        const mintTxn = await gameContract.enterGame(characterId, {
          value: ethers.utils.parseEther("0.1"),
        });
        await mintTxn.wait();
        console.log("mintTxn:", mintTxn);
      }
    } catch (error) {
      setMintingState("");
      console.warn("MintCharacterAction Error:", error);
    }
  };
  // Render Methods
  const renderCharacters = () =>
    characters.map((character, index) => (
      <div
        className={`character-item ${
          index !== mintedCharacter && mintingState == "minting"
            ? "--minting-not-current"
            : ""
        }`}
        key={character.name}
      >
        <div className="name-container">
          <p>{character.name}</p>
        </div>
        <img
          src={`https://cloudflare-ipfs.com/ipfs/${character.imageURI}`}
          alt={character.name}
        />
        <button
          type="button"
          className="character-mint-button"
          onClick={mintCharacterNFTAction(index)}
        >
          {mintingState == "minting" && mintedCharacter == index
            ? `Minting ${character.name} (this could take several minutes)`
            : `Mint ${character.name}`}
        </button>
        <div className="character-stat-container">
          <h3>Character Stats</h3>
          <ul>
            <li>
              base hp: <span>{character.hp}</span>
            </li>
            <li>
              hp mod: <span>{character.hpMod}</span>
            </li>

            <li>
              base dmg: <span>{character.attackDamage}</span>
            </li>
            <li>
              dmg mod: <span>{character.attackDamageMod}</span>
            </li>

            <li>
              critical hit %: <span>{character.criticalChance}</span>
            </li>
          </ul>
        </div>
        <div className="character-item__overlay"></div>
      </div>
    ));

  return (
    <div className="select-character-container">
      <h2>
        Mint Your Hero. Choose wisely. Minting costs 0.1eth, and all minting
        costs are put in a pool. If you kill the boss, you get all the eth in
        the pool!
      </h2>
      {/* Only show this when there are characters in state */}
      {characters.length > 0 && (
        <div className="character-grid">{renderCharacters()}</div>
      )}
      <div className="stats-key">
        <h2>Character Generation</h2>
        <p>
          Select a character from above, and your stats will be randomly
          generated using Chainlink VRF. It may take a few minutes to get the
          random number from Chainlink. The random number will determine a
          percentage of your <b>HP MOD</b> and <b>DMG MOD</b> to be added to
          your <b>BASE HP</b> and <b>BASE DMG</b> to determine your character's
          stats.
        </p>
      </div>
    </div>
  );
};

export default SelectCharacter;
