import { MinecraftBridge } from ".";
import { MintableToken } from "./token";
const Web3 = require('web3');

interface PoolManagerOptions {
    commonToken: string;
    contracts: {
        factory: string;
        router: string;
    }
}

export class PoolManager {

    commonToken: MintableToken;
    factory: any;
    router: any;

    private pairs: { [tokenAddress: string]: Pool } = {};

    constructor (public bridge: MinecraftBridge, private options: PoolManagerOptions) {
    }

    async init () {
        this.commonToken = await this.bridge.token(this.options.commonToken);

        this.factory = new this.bridge.web3.eth.Contract(require("../../contracts/abi/UniswapV2Factory.json"), this.options.contracts.factory);
        this.router = new this.bridge.web3.eth.Contract(require("../../contracts/abi/UniswapV2Router02.json"), this.options.contracts.router);
    }

    async pool (tokenAddress: string) {
        if(this.pairs[tokenAddress]) return this.pairs[tokenAddress];

        const address = await this.factory.methods.getPair(tokenAddress, this.commonToken.address).call(this.bridge.calldata);

        if (address === "0x0000000000000000000000000000000000000000") return null;
        
        return new Pool(this, this.pairs[tokenAddress] = address);
    }

    async quote (inputToken: string, outputToken: string, amount: number) {
        /*const path = this.commonToken.equals(inputToken)?
                        [this.commonToken.address, outputToken] :
                     this.commonToken.equals(outputToken)?
                        [inputToken, this.commonToken.address]  :
                     [inputToken, this.commonToken.address, outputToken]*/
        const path = [inputToken, this.commonToken.address, outputToken];

        const [,,amountsOut] = await this.router.methods.getAmountsOut(
            Web3.utils.toWei(amount.toString()),
            path
        ).call(this.bridge.calldata);

        console.log({
            amountsOut,
            path,
            result: await this.router.methods.getAmountsOut(
                Web3.utils.toWei(amount.toString()),
                path
            ).call(this.bridge.calldata)
        })

        return amountsOut/10e17;
    }

}

class Pool {

    contract: any;

    constructor (private manager: PoolManager, public address: string) {
        this.contract = new this.manager.bridge.web3.eth.Contract(require("../../contracts/abi/UniswapV2Pair.json"), address);
    }

    async price () {
        const { 0: reserve0, 1: reserve1 } = await this.contract.methods.getReserves().call(this.manager.bridge.calldata);
        const token0Address = await this.contract.methods.token0.call(this.manager.bridge.calldata);
        
        if (this.manager.commonToken.equals(token0Address)) return {
            price: reserve0 / reserve1,
            tokenBalance: reserve1 / 10e17,
            baseBalance: reserve0 / 10e17
        }

        return {
            price: reserve1 / reserve0,
            tokenBalance: reserve0 / 10e17,
            baseBalance: reserve1 / 10e17
        }
    }

}