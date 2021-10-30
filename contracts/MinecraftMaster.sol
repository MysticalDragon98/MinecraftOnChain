
// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./MintableCoin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MinecraftMaster is Ownable {
    mapping (string => MintableCoin) tokens;
    
    constructor () {
        
    }
    
    function getToken (string memory id) public view returns (MintableCoin) {
        return tokens[id];
    }
    
    function createToken (string memory id) public onlyOwner returns (MintableCoin) {
        require(address(tokens[id]) == 0x0000000000000000000000000000000000000000);
        
        tokens[id] = new MintableCoin(id);
        
        return getToken(id);
    }
    
    function addToken (string memory id, address user, uint amount) public onlyOwner {
        getToken(id).mint(user, amount * 1e18);
    }
    
    function removeToken (string memory id, address user, uint amount) public onlyOwner {
        getToken(id).burn(user, amount * 1e18);
    }
    
    function getTokens (string memory id, address user) public view returns (uint256) {
        return getToken(id).balanceOf(user);
    }
}