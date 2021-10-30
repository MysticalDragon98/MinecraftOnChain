
// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./MintableCoin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MinecraftLands is Ownable {
    
    struct Land {
        uint x;
        uint y;
        address owner;
    }
    
    mapping (uint => mapping(uint => Land)) public lands;
    
    event LandCreated(uint x, uint y, address indexed owner);
    event LandTransferred(uint x, uint y, address indexed source, address indexed target);
    
    constructor () {
        
    }
    
    function createLand (uint x, uint y, address owner) public onlyOwner {
        require(landOwner(x, y) == 0x0000000000000000000000000000000000000000);
        lands[x][y] = Land(x, y, owner);
        
        emit LandCreated(x, y, owner);
    }
    
    function transferLand (uint x, uint y, address newOwner) public {
        require(landOwner(x, y) == msg.sender, "You are not the owner of this land");
        
        lands[x][y].owner = newOwner;
        emit LandTransferred(x, y, msg.sender, newOwner);
    }
    
    function landOwner (uint x, uint y) public view returns (address owner) {
        return lands[x][y].owner;
    }
    
}