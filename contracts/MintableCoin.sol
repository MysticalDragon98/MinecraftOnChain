// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MintableCoin is Ownable, ERC20 {
    
    constructor (string memory id) Ownable() ERC20(id, id) {
        
    }
    
    function mint (address target, uint amount) public onlyOwner {
        _mint(target, amount);
    }
    
    function burn (address target, uint amount) public onlyOwner {
        _burn(target, amount);
    }
    
}