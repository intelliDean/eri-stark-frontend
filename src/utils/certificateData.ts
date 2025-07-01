import { Certificate } from "../types";

export const getTypedData = (cert: Certificate) => {
  return {
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "version", type: "shortstring" }
      ],
      Certificate: [
        { name: "name", type: "shortstring" },
        { name: "id", type: "shortstring" },
        { name: "serial", type: "shortstring" },
        { name: "date", type: "felt" },
        { name: "owner", type: "ContractAddress" },
        { name: "metadata", type: "felt*" }
      ]
    },
    primaryType: "Certificate",
    domain: {
      name: "ERI",
      chainId: "SN_SEPOLIA",
      version: "1"
    },
    message: {
      name: cert.name,
      id: cert.id,
      serial: cert.serial,
      date: cert.date,
      owner: cert.owner,
      metadata: cert.metadata
    }
  };
};