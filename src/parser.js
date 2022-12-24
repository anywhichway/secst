const parser = async () => {
    const grammar = await fetch("./src/secst.peg").then((response) => response.text());
    return PEG.buildParser(grammar);
}
