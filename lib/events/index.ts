import { verboseLog } from "../verbose";
import { Land } from "../bridge/land";
const { highlight } = require('termx');
const { warning } = require('termx');
const log = verboseLog("EVENTS");

export async function Stake (username: string, qty: string, ...itemArgs: string[]) {
    const item = itemArgs.join(' ');
    const user = await minecraft.user(username);
    
    log("User", username, "minting", warning(item), highlight("x" + qty));

    try {
        const token = await minecraft.token(item, true);

        log("User", user.name, "minting", warning(item), highlight("x" + qty), "to the address", highlight(user.address));
        await token.mint(user.address, +qty);
    } catch (exc) {
        user.give(item, +qty);

        return user.tell(`Could not Mint ${item} to address: ${user.address}. ${exc.message}`)
    }
    
    log("User", user.name, "minted", warning(item), highlight("x" + qty), "to the address", highlight(user.address));

    user.tell(`Sent ${qty} ${item} to your address: ${user.address}`);
}

export async function Withdraw (username: string, qty: string, ...itemArgs: string[]) {
    const item = itemArgs.join(' ');
    const user = await minecraft.user(username);

    log("User", username, "burning", warning(item), highlight("x" + qty));

    try {
        const token = await minecraft.token(item);

        log("User", username, "burning", warning(item), highlight("x" + qty), "to the address", highlight(user.address));

        await token.burn(user.address, +qty);
    } catch (exc) {
        log(exc.message);
        return user.tell(`Could not withdraw ${item} from address: ${user.address}. Do you have enough tokens?`)
    }
    user.give(item, +qty);

    log("User", user.name, "burned", warning(item), highlight("x" + qty), "to the address", highlight(user.address));
    user.tell(`Withdrawed ${qty} ${item} from your address: ${user.address}`);
}

export async function ViewBalance (username: string, ...itemArgs: string[]) {
    const item = itemArgs.join(' ');
    const user = await minecraft.user(username);

    try {
        const token = await minecraft.token(item);
        const balance = await token.balance(user.address);

        user.tell(`You have ${balance.toFixed(1)} ${item} in your wallet!`);
    } catch (exc) {
        user.tell(`Could not fetch token info: ${exc.message}`)
    }
}

export async function Quote (username: string, amount: number, ...itemArgs: string[]) {
    const [ itemA, itemB ] = itemArgs.join(' ').split(' <-> ');
    const user = await minecraft.user(username);
    const tokenA = await minecraft.token(itemA);
    const tokenB = await minecraft.token(itemB);

    const quote = await minecraft.poolManager.quote(tokenA.address, tokenB.address, amount);

    user.tell(`${amount} ${itemA} = ${quote.toFixed(1)} ${itemB}.`);
}

export async function Claim (username: string, world: string, ...positionData: string[]) {
    const user = await minecraft.user(username);
    const lastClaim = $get(`lands_lastClaim[${username}]`);
    
    /*if (lastClaim && (Date.now() - lastClaim) < 24 * 60 * 60 * 1000)
        return user.tell(`You only can claim lands once each day, come back tomorrow for more :p`);*/
    
    await $set(`lands_lastClaim[${username}]`, Date.now())

    const [ x, y, z ] = [
        parseFloat(positionData[1]),
        parseFloat(positionData[3]),
        parseFloat(positionData[5])
    ];

    const [ chunkX, chunkY ] = [ Math.floor(x/16), Math.floor(z/16)];

    try {
        console.log({ world, chunkX, chunkY })
        const land = new Land(minecraft, world, chunkX, chunkY);
        
        await land.create(user.address);
    } catch (exc) {
        user.tell(`Could not claim land: ${exc.message}`)
    }
}

import { minecraft } from "../../index";
import { fromEventPattern } from "rxjs";import { $get, $set } from "../state";

