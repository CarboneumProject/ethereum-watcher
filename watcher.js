const Web3 = require('web3');
const abi = require('./abi.json');
const mysql = require('mysql');
const numeral = require('numeral');

// noinspection JSUnresolvedVariable
const web3 = new Web3(
  new Web3.providers.WebsocketProvider('wss://mainnet.infura.io/ws'),
);
const blockTimeStamp = {};
async function getBlockTimeStamp(blockNumber) {
  if (blockTimeStamp[blockNumber]) {
    return blockTimeStamp[blockNumber]
  } else {
    try {
      let data = await web3.eth.getBlock(blockNumber);
      blockTimeStamp[blockNumber] = data.timestamp ? data.timestamp : null;
      return blockTimeStamp[blockNumber];
    } catch (e) {
      return null;
    }
  }
}

let con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "password",
  database: "ethereum"
});

let sql = `
  SELECT symbol, address, id, decimals
  FROM ethereum.tokens
`;

let sqlEvents = `INSERT IGNORE INTO tokens_operations (address,
                                                _from,
                                                _to,
                                                _value,
                                                hash,
                                                transactionIndex,
                                                blockNumber,
                                                blockHash,
                                                blockTimeStamp)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

let sqlBlock = `INSERT IGNORE INTO blocks (timestamp,
                                    number,
                                    hash,
                                    parent_hash,
                                    nonce,
                                    sha3_uncles,
                                    logs_bloom,
                                    transactions_root,
                                    state_root,
                                    receipts_root,
                                    miner,
                                    difficulty,
                                    total_difficulty,
                                    size,
                                    extra_data,
                                    gas_limit,
                                    gas_used,
                                    transaction_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

let sqlTransaction = `INSERT IGNORE INTO transactions (blockHash,
                                                     blockNumber,
                                                     \`from\`,
                                                     gas,
                                                     gasPrice,
                                                     \`hash\`,
                                                     input,
                                                     nonce,
                                                     \`to\`,
                                                     transactionIndex,
                                                     \`value\`,
                                                     \`timestamp\`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

let sqlWalletToken = `INSERT IGNORE INTO wallets_tokens (token_address, 
                                         wallet_address) 
                      VALUES (?,?)`;

let sqlFirstTransaction = `INSERT IGNORE INTO first_tx (address, blockTimeStamp) VALUES (?,?)`;

function addFirstTransaction(address, blockTimeStamp) {
  return new Promise(function (resolve, reject) {
    try {
      con.query(sqlFirstTransaction, [address, blockTimeStamp], function (err, result) {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    }
    catch (e) {
      resolve(false);
    }
  })
}

function addEventsTransfer(events) {
  return new Promise(function (resolve, reject) {
    try {
      con.query(sqlEvents, events, function (err, result) {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    }
    catch (e) {
      resolve(false);
    }
  })
}

function addBlockEvent(block) {
  return new Promise(function (resolve, reject) {
    try {
      con.query(sqlBlock, block, function (err, result) {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    }
    catch (e) {
      resolve(false);
    }
  })
}

function addTransaction(transaction) {
  return new Promise(function (resolve, reject) {
    try {
      con.query(sqlTransaction, transaction, function (err, result) {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    }
    catch (e) {
      resolve(false);
    }
  })
}

function addWalletToken(tokenAddress, walletAddress) {
  return new Promise(function (resolve, reject) {
    try {
      con.query(sqlWalletToken, [tokenAddress, walletAddress], function (err, result) {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    }
    catch (e) {
      resolve(false);
    }
  })
}


con.connect(async function (err) {
  if (err) throw err;
  console.log("Mysql Connected!");
  con.query(sql, async function (err, result) {
    if (err) throw err;
    result.forEach(async function (row) {
      const tokenContract = new web3.eth.Contract(
        abi,
        row.address,
      );
      const subscription = tokenContract.events
        .Transfer(null, async (error, event) => {
          if (error) return console.error(error);
          let from = event.returnValues['_from'];
          let to = event.returnValues['_to'];
          let timestamp = await getBlockTimeStamp(event.blockNumber);
          let value = numeral(event.returnValues['_value'] / Math.pow(10, row.decimals)).format('0,0.0000[00000000000000]');
          let object = [
            row.address,
            from,
            to,
            value,
            event.transactionHash,
            event.transactionIndex,
            event.blockNumber,
            event.blockHash,
            new Date(timestamp * 1000)
          ];

          addEventsTransfer(object);
          addWalletToken(row.address, to);

        })
        .on('data', event => {
          // same results as the optional callback above
        })
        .on('changed', event => {
          // remove event from local datablase
        })
        .on('error', console.error);

      // unsubscribes the subscription
      subscription.unsubscribe((error) => {
        if (error) return console.error(error);

        console.log('Successfully unsubscribed!');

      });
    });
  });
});

async function watchEtherTransfers(blockNumber) {
  if (blockNumber === 0) {
    blockNumber = (await web3.eth.getBlock('latest')).number;
  }

  setTimeout(async () => {
    while (true) {
      let block = await web3.eth.getBlock(blockNumber);
      if (block == null) {
        return watchEtherTransfers(blockNumber);
      }

      console.log(blockNumber);

      let object = [
        new Date(block.timestamp * 1000),
        block.number,
        block.hash,
        block.parentHash,
        block.nonce,
        block.sha3Uncles,
        block.logsBloom,
        block.transactionsRoot,
        block.stateRoot,
        block.receiptsRoot,
        block.miner,
        block.difficulty,
        block.totalDifficulty,
        block.size,
        block.extraData,
        block.gasLimit,
        block.gasUsed,
        block.transactions.length
      ];

      addBlockEvent(object);

      block.transactions.forEach(async function (txHash) {
        let trx = await web3.eth.getTransaction(txHash);
        if (trx != null && trx.to != null) {
          let timeStamp = new Date(block.timestamp * 1000);
          addFirstTransaction(trx.from, timeStamp);
          addFirstTransaction(trx.to, timeStamp);

          let transaction = [
            block.hash,
            block.number,
            trx.from,
            trx.gas,
            trx.gasPrice,
            trx.hash,
            trx.input,
            trx.nonce,
            trx.to,
            trx.transactionIndex,
            trx.value,
            timeStamp
          ];
          addTransaction(transaction);
        }
      });
      blockNumber++;
    }
  }, 30 * 1000)
}

watchEtherTransfers(0);
