// SPDX-License-Identifier: MIT
pragma solidity 0.8.7^;

contract ManualToken{
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256))public allowance;

    // transfer tokens
    // subtract from address amount and add to address
    function _transfer(address from, address to, uint256 amount) public {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success){
        require(_value <= allowance[_from][msg.sender]); // check allowance
        allowance[_from][msg.sender] -= value;
        transfer(_from, _to, _value);
        return true;
    }
}