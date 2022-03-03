/*SPDX-License-Identifier: MIT*/
pragma solidity ^0.8.11;

contract CampaignFactory {
    address[] public deployedCampaigns;

    function createCampaign(uint minimum) public payable {
        Campaign c = new Campaign(minimum, msg.sender);
        deployedCampaigns.push(address(c));
    }

    function getCampaigns() public view returns (address[] memory) {
        return deployedCampaigns;
    }
}

contract Campaign {
    struct Request {
        string description;
        uint value;
        address payable recipient;
        uint approvalsCount;
        bool complete;
    }

    Request[] public requests;
    address public manager;
    uint public minimumContribution;
    uint public donatorsCount;

    mapping(address => bool) public donators;
    mapping(uint => mapping(address => bool)) public approvers;

    constructor(uint minimum, address creator)  {
        manager = creator;
        minimumContribution = minimum;
        donatorsCount = 0;
    }

    function contribute() public payable {
        require(msg.value > minimumContribution);
        require(!donators[msg.sender]);

        donatorsCount++;
        donators[msg.sender] = true;
    }

    function createRequest(uint value, string memory description, address payable recipient) 
        public payable restricted {
        Request memory newRequest = Request({
            description: description,
            recipient: recipient,
            value: value,
            approvalsCount: 0,
            complete: false
        });

        requests.push(newRequest);
    }

    function approveRequest(uint index) public payable {
        Request storage r = requests[index];

        require(donators[msg.sender]);
        require(!approvers[index][msg.sender]);
        
        approvers[index][msg.sender] = true;
        r.approvalsCount++;
    }

    function finalizeRequest(uint index) public restricted {
        Request storage r = requests[index];
        require(r.approvalsCount > (donatorsCount / 2));
        require(!r.complete);

        r.recipient.transfer(r.value);
        r.complete = true;
    }

    modifier restricted() {
        require(msg.sender == manager);
        _;
    }
}
