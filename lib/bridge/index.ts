const Web3 = require('web3');
const readline = require('readline');
const HDWallet = require('@truffle/hdwallet-provider');

import { verboseLog } from "../verbose";
import { danger, highlight } from "termx";
import { MintableToken } from "./token";
import { exec } from "child_process";
import * as Events from "../events";
import { User } from "./user";
import { writeFile } from "fs/promises";

const log = verboseLog("BRIDGE");
const commandRegex = /^\[.+?\] \[Server thread\/INFO\]: \[Server\] \(Event\) /;

interface BridgeOptions {
    // Ethereum
        host: string;
        ports: {
            sshd: number;
            logs: number;
        }

        username: string;
        sshKey: string;
        logsPath: string;

        // Account
            address: string;
            privateKey: string;
        // Provider
            providerURL: string;
            chainId?: number;
            gasPrice?: number;

        // Contracts
            contracts: {
                master: string,
                lands: string,
                registry: string,
                
                uniswapV2Factory: string,
                uniswapV2Router02: string
            }
        // Pools
            pools: {
                commonToken: string
            }
}

export class MinecraftBridge {

    public  web3: any;
    public master: any;
    public lands: any;
    public registry: any;

    private tokens: { [name: string]: MintableToken } = {};
    public poolManager: PoolManager;
    
    public minecraftsshd: MinecraftSSH;
    public minecraftlogs: MinecraftSSH;

    private stdin: any;

    constructor (private options: BridgeOptions) {
        this.web3 = new Web3(new HDWallet(options.privateKey, options.providerURL));
        this.master = new this.web3.eth.Contract(require('../../contracts/abi/MinecraftMaster.json'), options.contracts.master);
        this.lands = new this.web3.eth.Contract(require('../../contracts/abi/MinecraftLands.json'), options.contracts.lands);
        this.registry = new this.web3.eth.Contract(require('../../contracts/abi/MinecraftRegistry.json'), options.contracts.registry);
        this.poolManager = new PoolManager(this, {
            commonToken: options.pools.commonToken,
            contracts: {
                factory: options.contracts.uniswapV2Factory,
                router: options.contracts.uniswapV2Router02
            }
        })
    }

    async init () {
        log("Initializing bridge...");

        log(`Verifying ownership over Master Contract: ${highlight(this.options.contracts.master)}`);
        if(!await this.isOwnerOf(this.master)) return log(danger(`You are not the owner of this Master Contract.`));

        log(`Verifying ownership over Registry Contract: ${highlight(this.options.contracts.registry)}`);
        if(!await this.isOwnerOf(this.registry)) return log(danger(`You are not the owner of this Registry Contract.`));

        log(`Verifying ownership over Lands Contract: ${highlight(this.options.contracts.lands)}`);
        if(!await this.isOwnerOf(this.lands)) return log(danger(`You are not the owner of this Lands Contract.`));
        log(`Initializing pool manager...`);
        await this.poolManager.init();
        log(`Connecting to SSHD...`);
        
        this.minecraftsshd = new MinecraftSSH({
            host: this.options.host,
            port: this.options.ports.sshd,
            privateKey: this.options.sshKey,
            username: this.options.username
        });

        await this.minecraftsshd.connect();

        log(`Connecting to SSHD logs...`);
        this.minecraftlogs = await MinecraftSSHDLogs({
            host: this.options.host,
            port: this.options.ports.logs,
            privateKey: this.options.sshKey,
            username: this.options.username
        }, this.options.logsPath);

        log(`Configuring streams...`);

        this.configureStreams(this.minecraftsshd.stdin, this.minecraftlogs);

        await User.register(this, "GodKmi", "0x014334C5c94051A21d50cDdAD77D2Db0098786B9")
        await User.register(this, "CrixTD", "0xE0fBc2A5398d2eA5836c9dB244664A4D10831B28")
        log(`Success!`);
    }

    async configureStreams (stdin, stdout) {
        try {
            this.stdin = stdin;
    
            var lines = readline.createInterface({
                input: stdout,
                crlfDelay: Infinity
            });
    
            stdout.pipe(process.stdout);
            process.stdin.pipe(stdin);
        } catch (exc) {
            log(danger("Could not configure streams:"), exc.message);
        }

        for await (const line of lines) {
            if(line.substring(line.indexOf(" [") + 1).trim() == "[Server thread/INFO]: [Skript] Finished loading.") {
                await Land.setup(this);
            }
            if(!commandRegex.exec(line)) continue;
            const command = line.substring(line.indexOf("(Event) ") + 8).trim().split(" ");
        
            if(!Events[command[0]]) {
                log(danger("No command found:"), command[0]);
                continue;
            }
        
            try {
                await Events[command[0]](...command.slice(1));
            } catch (exc) {
                log(danger("Command failed:"), exc);
            }
        }
    }

    async userByAddress (address: string) {
        const username = await this.registry.methods.getName(address).call(this.calldata);

        return new User(this, username, address);
    }

    async user (name: string) {
        return new User(this, name, await this.userAddress(name));
    }

    async userAddress (name: string) {
        return await this.registry.methods.getAddress(name).call(this.calldata);
    }

    async token (name: string, upsert?: boolean): Promise<MintableToken> {
        if(this.tokens[name]) return this.tokens[name];

        const tokenAddress = await this.master.methods.getToken(name).call(this.calldata);
        
        if(tokenAddress == "0x0000000000000000000000000000000000000000") {
            if (!upsert) throw new Error("Token " + name + " does not exists");
            log("Token ", highlight(name), "does not exist, creating...");
            
            await this.master.methods.createToken(name).send(this.senddata);
            return await this.token(name);
        }

        const token = new MintableToken(this, tokenAddress);
        await token.init();

        return this.tokens[name] = token;
    }

    async isOwnerOf(contract: any) {
        try {
            return (await contract.methods.owner().call(this.calldata)).toLowerCase() === this.options.address.toLowerCase();
        } catch (exc) {
            log(danger(exc.message));
        }
    }

    async execute (command: string) {
        log("Executing /", command.trim())
        return await this.stdin.write(command + "\n");
    }

    get calldata () {
        return ({
            chainId: this.options.chainId,
            from: this.options.address
        });
    }
    
    get senddata () {
        return ({
            chainId: this.options.chainId,
            gasPrice: (this.options.gasPrice || 5) + "000000000",
            from: this.options.address
        });
    }

    async generateTokenList (ids: string[]) {
        const items = await Promise.all(ids.map(async id => {
            const token = await this.token(id);

            return token.toTokenListItem();
        }));

        return items;
    }
}

import { PoolManager } from "./pools";
import { Land } from "./land";import { MinecraftSSH, MinecraftSSHD, MinecraftSSHDLogs } from "@mysticaldragon/minecraftsshd";
import { resolve } from "path";

