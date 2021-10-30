// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MinecraftRegistry is Ownable {
    
    mapping (string => address) registry;
    mapping (address => string) registryAddress;
    
    constructor (string memory id) Ownable() {
        
    }
    
    function register (string memory name, address target) public onlyOwner {
        if(registry[name] != 0x0000000000000000000000000000000000000000)
            registryAddress[registry[name]] = "";
            
        registry[name] = target;
        registryAddress[target] = name;
    }
    
    function getAddress (string memory name) public view returns (address) {
        return registry[name];
    }
    
    function getName (address user) public view returns (string memory) {
        return registryAddress[user];
    }
}