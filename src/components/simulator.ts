/**
MIT License

Copyright (c) 2021 Kishan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

/**
* Used to simulate whop wins
NOT THE BEST ALOGRITHM.
*/

interface Match {
	a: string,
	b: string,
}

interface FixedLengthArray<T extends any, L extends number> extends Array<T> {
	0: T;
	length: L;
}

interface Matches {
	knockout: FixedLengthArray<Match, 8>,
	qFinal: FixedLengthArray<Match, 4>,
	semiFinal: FixedLengthArray<Match, 2>,
	final: Match,
	runnerUp: Match,
}

const lines: Array<[string, number]> = [
	["Victoria", 1.6],
	["Jubilee", 1.6],
	["DLR", 2.6],
	["Northern", 5.0],
	["Overground", 5.3],
	["Piccadilly", 6.0],
	["District", 7.0],
	["Metropolitan", 7.3],
	["Central", 9.6],
	["Bakerloo", 10.0],
	["Circle", 11.0],
	["W&C", 11.6],
	["TfL Rail", 13.6],
	["Trams", 14.0],
	["H&C", 14.0],
	["CableCar", 16.0],
]

function getMostLikelyMatch(lineList: Array<[string, number]>, line: string): { line: [string, number], index: number } {
	const rankIndex = lineList.findIndex(item => item[0] === line)
	if (rankIndex === -1) {
		throw Error(`Could not find that line ${line}!`);
	}

	if (rankIndex === 0) {
		// Go down
		return {
			line: lineList[rankIndex + 1],
			index: rankIndex + 1
		}
	} else {
		// Go up
		return {
			line: lineList[rankIndex - 1],
			index: rankIndex - 1
		}
	}
}

/**
 * b will always be populated by the new thing
 * @param lineList 
 * @param line 
 */
function generateLikelyMatchFor(lineList: Array<[string, number]>, line: string): Match {
	const theMatch = getMostLikelyMatch(lineList, line);
	return {
		a: line,
		b: theMatch.line[0],
	}
}

function doesNotMatch(item, items): boolean {
	if (items.includes(item)) {
		return false;
	}
	return true;
}

function matchToArray(matchA: Match): [string, string] {
	return [matchA.a, matchA.b];
}

function matchesToArray(matches: Match[]): string[] {
	return matches.reduce((acc, matchA) => acc.concat(matchA.a, matchA.b), [])
}

export function getRank(train: string): Matches {
	const matchForFinal = generateLikelyMatchFor(lines, train);
	/// @ts-ignore
	const out: Matches = {
		/// @ts-ignore
		knockout: new Array<Match>(8),
		/// @ts-ignore
		qFinal: new Array<Match>(4),
		/// @ts-ignore
		semiFinal: new Array<Match>(2),
		final: matchForFinal,
		/// @ts-ignore
		runnerUp: {}
	}

	// Generate semi-finals
	// 2 matches
	// For our train
	out.semiFinal[0] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [matchForFinal.b])),
		train,
	);
	// For the other
	out.semiFinal[1] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [matchForFinal.a, out.semiFinal[0].b])),
		matchForFinal.b,
	);

	// Propogate runnerup
	out.runnerUp = {
		a: out.semiFinal[0].b,
		b: out.semiFinal[1].b,
	}

	// Now, we can propogate qFinals

	// Based off semi-final 1, a
	out.qFinal[0] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [out.semiFinal[1].a, out.semiFinal[1].b, out.semiFinal[0].b])),
		out.semiFinal[0].a,
	);

	// Based off semi-final 1, b
	out.qFinal[1] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [out.semiFinal[1].a, out.semiFinal[1].b, out.semiFinal[0].a, out.qFinal[0].a, out.qFinal[0].b])),
		out.semiFinal[0].b,
	);

	// Based off semi-final 2, a
	out.qFinal[2] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [
			// Don't match the other match
			out.semiFinal[0].a, out.semiFinal[0].b,
			// Don't match the other semi-final option
			out.semiFinal[1].b,
			// Don't match the other matches
			...matchesToArray([out.qFinal[0], out.qFinal[1]])
		])),
		out.semiFinal[1].a,
	);

	// Based off semi-final 2, b
	out.qFinal[3] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [
			// Don't match the other match
			out.semiFinal[0].a, out.semiFinal[0].b,
			// Don't match the other semi-final option
			out.semiFinal[1].a,
			// Don't match the other matches
			...matchesToArray([out.qFinal[0], out.qFinal[1], out.qFinal[2]])
		])),
		out.semiFinal[1].b,
	);

	// Finally, knockout

	// qFinal 1
	out.knockout[0] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [
			// Don't match the other match
			// Don't match the other semi-final option
			out.qFinal[0].b,
			// Don't match the other matches
			...matchesToArray([out.qFinal[1], out.qFinal[2], out.qFinal[3]])
		])),
		out.qFinal[0].a,
	);

	out.knockout[1] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [
			// Don't match the other match
			// Don't match the other semi-final option
			out.qFinal[0].a,
			// Don't match the other matches
			...matchesToArray([out.knockout[0], out.qFinal[1], out.qFinal[2], out.qFinal[3]])
		])),
		out.qFinal[0].b,
	);

	// qFinal 2
	out.knockout[2] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [
			// Don't match the other match
			// Don't match the other semi-final option
			out.qFinal[1].b,
			// Don't match the other matches
			...matchesToArray([
				out.knockout[0],
				out.knockout[1],

				out.qFinal[0], out.qFinal[2], out.qFinal[3]])
		])),
		out.qFinal[1].a,
	);
	out.knockout[3] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [
			// Don't match the other match
			// Don't match the other semi-final option
			out.qFinal[1].a,
			// Don't match the other matches
			...matchesToArray([
				out.knockout[0],
				out.knockout[1],
				out.knockout[2],

				out.qFinal[0], out.qFinal[2], out.qFinal[3]])
		])),
		out.qFinal[1].b,
	);

	//qFinal 3
	out.knockout[4] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [ // CHANGE
			// Don't match the other match
			// Don't match the other semi-final option
			out.qFinal[2].b, // CHANGE
			// Don't match the other matches
			...matchesToArray([
				out.knockout[0],
				out.knockout[1],
				out.knockout[2],
				out.knockout[3], // CHANGE

				out.qFinal[0], out.qFinal[1], out.qFinal[3]]) // CHANGE
		])),
		out.qFinal[2].a, // CHANGE
	);
	out.knockout[5] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [ // CHANGE
			// Don't match the other match
			// Don't match the other semi-final option
			out.qFinal[2].a, // CHANGE
			// Don't match the other matches
			...matchesToArray([
				out.knockout[0],
				out.knockout[1],
				out.knockout[2],
				out.knockout[3],
				out.knockout[4], // CHANGE

				out.qFinal[0], out.qFinal[1], out.qFinal[3]]) // CHANGE
		])),
		out.qFinal[2].b, // CHANGE
	);

	//qFinal 4
	out.knockout[6] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [ // CHANGE
			// Don't match the other match
			// Don't match the other semi-final option
			out.qFinal[3].b, // CHANGE
			// Don't match the other matches
			...matchesToArray([
				out.knockout[0],
				out.knockout[1],
				out.knockout[2],
				out.knockout[3],
				out.knockout[4],
				out.knockout[5], // CHANGE

				out.qFinal[0], out.qFinal[1], out.qFinal[2]]) // CHANGE
		])),
		out.qFinal[3].a, // CHANGE
	);
	out.knockout[7] = generateLikelyMatchFor(
		lines.filter((line) => doesNotMatch(line[0], [ // CHANGE
			// Don't match the other match
			// Don't match the other semi-final option
			out.qFinal[3].a, // CHANGE
			// Don't match the other matches
			...matchesToArray([
				out.knockout[0],
				out.knockout[1],
				out.knockout[2],
				out.knockout[3],
				out.knockout[4],
				out.knockout[5],
				out.knockout[6], // CHANGE

				out.qFinal[0], out.qFinal[2], out.qFinal[2]]) // CHANGE
		])),
		out.qFinal[3].b, // CHANGE
	);



	return out;
}

console.log(getRank("CableCar"));