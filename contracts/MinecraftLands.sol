
// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "./MintableCoin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MinecraftLands is Ownable {
    
    struct Land {
        string world;
        int x;
        int y;

        address owner;
    }
    
    mapping (string => mapping(int => mapping(int => Land))) public lands;
    
    event LandCreated(string world, int x, int y, address indexed owner);
    event LandTransferred(string world, int x, int y, address indexed source, address indexed target);
    
    constructor () {
        
    }
    
    function createLand (string memory world, int x, int y, address owner) public onlyOwner {
        require(landOwner(world, x, y) == 0x0000000000000000000000000000000000000000);
        lands[world][x][y] = Land(world, x, y, owner);
        
        emit LandCreated(world, x, y, owner);
    }
    
    function transferLand (string memory world, int x, int y, address newOwner) public {
        require(landOwner(world, x, y) == msg.sender, "You are not the owner of this land");
        
        lands[world][x][y].owner = newOwner;
        emit LandTransferred(world, x, y, msg.sender, newOwner);
    }
    
    function landOwner (string memory world, int x, int y) public view returns (address owner) {
        return lands[world][x][y].owner;
    }
    
}