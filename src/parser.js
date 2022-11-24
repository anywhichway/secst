const parser = async () => {
    const grammar = await fetch("./src/grammar.txt").then((response) => response.text());
    return PEG.buildParser(grammar);
}
