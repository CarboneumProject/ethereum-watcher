create database if not exists ethereum;
use ethereum;

create table if not exists ethereum.blocks
(
  timestamp         timestamp default CURRENT_TIMESTAMP not null
  on update CURRENT_TIMESTAMP,
  number            int                                 not null primary key,
  hash              varchar(255)                        null,
  parent_hash       varchar(255)                        null,
  nonce             varchar(255)                        null,
  sha3_uncles       varchar(255)                        null,
  logs_bloom        text                                null,
  transactions_root varchar(255)                        null,
  state_root        varchar(255)                        null,
  receipts_root     varchar(255)                        null,
  miner             varchar(42)                         null,
  difficulty        varchar(50)                         null,
  total_difficulty  varchar(50)                         null,
  size              int                                 null,
  extra_data        varchar(255)                        null,
  gas_limit         int                                 null,
  gas_used          int                                 null,
  transaction_count int                                 null
);

create index blocks_number_index
  on ethereum.blocks (number);

create index blocks_timestamp_index
  on ethereum.blocks (timestamp);

####################


create table if not exists ethereum.first_tx
(
  address        varchar(42) charset utf8            not null primary key,
  blockTimeStamp timestamp default CURRENT_TIMESTAMP not null
  on update CURRENT_TIMESTAMP
);

####################


create table if not exists ethereum.tokens_operations
(
  address          varchar(255) null,
  `_from`          varchar(255) null,
  `_to`            varchar(255) null,
  `_value`         varchar(255) null,
  hash             varchar(255) not null,
  transactionIndex varchar(255) null,
  blockNumber      int          null,
  blockHash        varchar(255) null,
  blockTimeStamp   timestamp    null,
  eventName        varchar(255) null
);

create index tokens_operations__from_index
  on ethereum.tokens_operations (`_from`);

create index tokens_operations__to_index
  on ethereum.tokens_operations (`_to`);

create index tokens_operations_address__to_index
  on ethereum.tokens_operations (address, `_to`);

create index tokens_operations_address_index
  on ethereum.tokens_operations (address);

create index tokens_operations_blockNumber_index
  on ethereum.tokens_operations (blockNumber);

create index tokens_operations_blockTimeStamp_index
  on ethereum.tokens_operations (blockTimeStamp);

####################


create table if not exists ethereum.transactions
(
  blockHash        varchar(255)                        null,
  blockNumber      varchar(255)                        null,
  `from`           varchar(255)                        null,
  gas              varchar(255)                        null,
  gasPrice         varchar(255)                        null,
  hash             varchar(255)                        not null primary key,
  input            text                                null,
  nonce            varchar(255)                        null,
  `to`             varchar(255)                        null,
  transactionIndex varchar(255)                        null,
  value            varchar(255)                        null,
  timestamp        timestamp default CURRENT_TIMESTAMP not null,
  eventName        varchar(255)                        null,
  `_from`          varchar(255)                        null,
  `_to`            varchar(255)                        null,
  `_spender`       varchar(255)                        null,
  `_value`         varchar(255)                        null,
  constraint operations_hash_uindex
  unique (hash)
);

create table if not exists ethereum.tokens
(
  id                int auto_increment,
  blockNumber       varchar(255) null,
  address           varchar(255) not null,
  symbol            varchar(255) null,
  name              varchar(255) null,
  decimals          int          null,
  circulatingSupply double       null,
  totalSupply       double       null,
  maxSupply         double       null,
  marketCap         double       null,
  `rank`            int          null,
  tag               json         null,
  twitter           json         null,
  reddit            json         null,
  chat              json         null,
  explorer          json         null,
  source_code       json         null,
  announcement      json         null,
  message_board     json         null,
  website           json         null,
  constraint address
  unique (address),
  constraint id
  unique (id)
);

create index tokens_symbol_index
  on tokens (symbol);

alter table tokens
  add primary key (address);


create table ethereum.wallets_tokens
(
  token_address  varchar(42) not null,
  wallet_address varchar(42) not null,
  constraint wallets_tokens_pk
  unique (token_address, wallet_address)
);

create index wallets_tokens_token_address_index
  on wallets_tokens (token_address);

create index wallets_tokens_token_address_wallet_address_index
  on wallets_tokens (token_address, wallet_address);

create index wallets_tokens_wallet_address_index
  on wallets_tokens (wallet_address);

