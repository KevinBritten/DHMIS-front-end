import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData, transformCharacterDataBoss } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';
import './Arena.css';

/*
 * We pass in our characterNFT metadata so we can a cool card in our UI
 */
const Arena = ({ characterNFT, setCharacterNFT }) => {
  // State
  const [gameContract, setGameContract] = useState(null);
    const [provider, setProvider] = useState(null);
    const [bossBalance, setBossBalance] = useState(0)
  const [boss, setBoss] = useState(null);
    const [otherCharacters, setOtherCharacters] = useState(null);
  const [attackState, setAttackState] = useState('');
  const [bossKillers, setBossKillers] = useState([])
  const [siteMessage, setSiteMessage] = useState('')
  const [healState, setHealState] = useState('')



  // UseEffects
  useEffect(async () => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );
      

      setGameContract(gameContract);
      setProvider(provider)
    } else {
      console.log('Ethereum object not found');
    }
  }, []);
   useEffect(() => {
        const fetchBoss = async () => {
            const bossTxn = await gameContract.getBigBoss();
            console.log('Boss:', bossTxn);
   


            setBoss(transformCharacterDataBoss(bossTxn));
            
           
        };

        const fetchOtherCharacters = async ()=> {
          const nftHolderAddresses = await gameContract.getAllNftHolderAddresses()

          // get the current user's address
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];
          const otherPlayerAddresses = nftHolderAddresses.filter((address)=>{
            return address.toLowerCase() !== account.toLowerCase() ? address : false
          })

          async function pushTransformedCharacters(address){
            const txnOtherCharacter = await gameContract.getOneTokenByAddress(address);
            const transformedCharacter = transformCharacterData(txnOtherCharacter)
            transformedCharacter.address = address
            return transformedCharacter
          }

          const otherCharactersArray =
await Promise.all(otherPlayerAddresses.map(pushTransformedCharacters))
setOtherCharacters(otherCharactersArray);
        }

        const fetchBossKillers = async()=>{
          const bossKillersArray = await gameContract.getBossKillers()
          setBossKillers(bossKillersArray)
          console.log(bossKillersArray)
        }

        /*
        * Setup logic when this event is fired off
        */
        const onAttackComplete = async (newPlayerHp,newBossHp, bossDead, isCriticalHit) => {
          
            const bossHp = newBossHp.toNumber();
            const playerHp = newPlayerHp.toNumber();
            if (isCriticalHit){console.log('Critical Hit!')};
            
            console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);
        
  const balance = await provider.getBalance(gameContract.address)
          setBossBalance(ethers.utils.formatEther(balance))
            /*
            * Update both player and boss Hp
            */
            const isCriticalHitMessage = isCriticalHit ? 'Critical Hit! You did double damage. ' : ''
            const bossDeadMessage = bossDead ? `You killed roy and got the eth! Roy has come back even stronger, now with ${bossHp}hp.` : ''
            const playerDeadMessage = newPlayerHp == 0 ? 'Oh no, Roy killed you! You can get back in the game for 0.125eth.':''
            const attackMessage = bossDead || newPlayerHp == 0 ?  bossDeadMessage + ' '  + playerDeadMessage : 'You hit Roy, and got hit back.' 
           setSiteMessage(isCriticalHitMessage + attackMessage)
            setBoss((prevState) => {
                return { ...prevState, hp: bossHp };
            });
            if (bossDead) {
                setBoss((prevState) => {
                return { ...prevState, maxHp: bossHp };
            });
            }

            setCharacterNFT((prevState) => {
                return { ...prevState, hp: playerHp };
            });
        };

 const setInitialBossBalance = async ()=>{
const balance = await provider.getBalance(gameContract.address)
          setBossBalance(ethers.utils.formatEther(balance))
 }

        if (gameContract) {
            fetchBoss();
            fetchOtherCharacters();
             setInitialBossBalance();
             fetchBossKillers();
            gameContract.on('AttackComplete', onAttackComplete);
        }

        /*
        * Make sure to clean up this event when this component is removed
        */
        return () => {
            if (gameContract) {
                gameContract.off('AttackComplete', onAttackComplete);

            }
        }
    }, [gameContract]);
// Actions
const runAttackAction = async () => {

  try {
    if (gameContract) {
      setAttackState('attacking');
      console.log('Attacking boss...');
      const attackTxn = await gameContract.attackBoss();
      await attackTxn.wait();
      console.log('attackTxn:', attackTxn);
      setAttackState('hit');
    }
  } catch (error) {
    console.error('Error attacking boss:', error);
    setAttackState('');
    setSiteMessage('Error attacking boss, try again and it should work.')
  }
};

const closeSiteMessage = ()=>{
  setSiteMessage('')
}

const runHealAction = async()=>{
  try {
    if (gameContract) {
      setHealState('healing');
      console.log('Healing...');
      const attackTxn = await gameContract.restoreHealth({value: ethers.utils.parseEther("0.125")})
      console.log('healed!')
      setHealState('healed');
       setCharacterNFT((prevState) => {
                return { ...prevState, hp: playerHp };
            });
      
    }
  } catch (error) {
    console.error('Error healing player:', error);
    setHealState('');
  }
}

return (
  <div className="arena-container">
   
    {/* Boss */}
    {boss && (
    <div className="boss-container">
        {/* Add attackState to the className! After all, it's just class names */}
        <div className={`boss-content ${attackState}`}>
          <h2>🔥 {boss.name} 🔥</h2>
                      <h3>Current Prize: {bossBalance} eth</h3>

          <div className="image-content">
            <img src={`https://cloudflare-ipfs.com/ipfs/${boss.imageURI}`} alt={`Boss ${boss.name}`} />
            <div className="health-bar">
              <progress value={boss.hp} max={boss.maxHp} />
              <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
            </div>
          </div>
        </div>
        <div className="attack-container">
          <button className="cta-button" onClick={runAttackAction}>
            {`💥 Attack ${boss.name}`}
          </button>
        </div>
      </div>
    )}
 {/* Boss Killers */}
    {bossKillers && (
    <div className="boss-killer-container">
    <h2>Characters from these addresses have killed the boss.</h2>
    
      <div>{
       bossKillers.map((killer)=>{
        return (<p>{killer}</p>)
      })}</div>
  
    </div>
      )}
    {/* Replace your Character UI with this */}
    {characterNFT && (
  
        <div className="player-container">
          <div className="player">
            <div className="image-content">
                      <h3>Your Character:</h3>
              <h2>{characterNFT.name}</h2>
              <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}
              </h4>
              <h4>{`Critical Chance: ${characterNFT.criticalChance}% `}</h4>
              <img
                 src={`https://cloudflare-ipfs.com/ipfs/${characterNFT.imageURI}`}
                alt={`Character ${characterNFT.name}`}
              />
              <div className="health-bar">
                <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                {characterNFT.hp == 0 && <button className='heal-btn' onClick={runHealAction}>{healState == 'healing'? 'Healing!' : 'Click to heal for 0.125eth'}</button>}
              </div>
            </div>
            <div className="stats">
              
            </div>
          </div>
        </div>)}
                {/* Other Player Characters */}

            { otherCharacters && (

        <div className="other-players-container"> 
        <h2>Other Players</h2>
        <div className="other-players-inner-container">
         {otherCharacters.map((character, i)=>{  return  (
          <div className="other-player" key={i}>
          <img
                 src={`https://cloudflare-ipfs.com/ipfs/${character.imageURI}`}
                alt={`Character ${character.name}`}
              />
            <h3>Owner:</h3>
            <a className='address-text' href={`https://rinkeby.etherscan.io/address/${character.address}`}>{`${character.address.slice(0,12)}...`}</a>
            
                <p>{`${character.hp} / ${character.maxHp} HP`}</p>                <p>{` Attack Damage: ${character.attackDamage}`}</p>

             
          </div>        )

        })}</div></div>

    )}

{siteMessage.length > 1 && (
  <div className='site-message'><p>{siteMessage}</p><button className='site-message__close-btn' onClick={closeSiteMessage}>X</button></div>
)}

  </div>
);
};

export default Arena;