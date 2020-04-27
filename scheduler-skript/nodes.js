const fs = require("fs");

/**
 * load data from JSON file
 * @returns {*[]|any}
 */
const loadNodes = () => {
    try {
        const dataBuffer = fs.readFileSync("nodes.json");
        const dataJSON = dataBuffer.toString();
        return JSON.parse(dataJSON);
    } catch (e) {
        return [];
    }
};


const saveNodes = function (nodes) {
    const nodeJSON = JSON.stringify(nodes);
    fs.writeFileSync("nodes1.json", nodeJSON);
};

/**
 * list input data
 */
const listNodes = () => {
    const nodes = loadNodes();
    nodes.forEach((element) => {
        console.log(element);
    });
};

/**
 * Find start of path in input data
 * @param nodes list of addresses
 * @returns {*} start position
 */
const startPoint = (nodes) => {
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].position === 0) return nodes[i];
    }
};
/**
 * Get pivot of cluster
 * @param start first position of path
 * @param clusterNodes cluster of several points
 * @returns {*} pivot of cluster
 */
const getPivot = (start, clusterNodes) => {
    const d = [];
    for (let i = 0; i < clusterNodes.length; i++) {
        d[i] = distance(start, clusterNodes[i]);
    }
    let min = d[0];
    let minIndex = 0;
    for (let i = 1; i < d.length; i++) {
        if (d[i] < min) {
            min = d[i];
            minIndex = i;
        }
    }
    return clusterNodes[minIndex];
};

/**
 * Get index of pivot in matrix
 * @param cluster
 * @param pivot pivot of cluster
 * @returns {number} position of pivot in cluster
 */
const pivotIndex = (cluster, pivot) => {
    for (let i = 0; i < cluster.length; i++) {
        if (cluster[i] === pivot) return i;
    }
    return -1;
}

/**
 * Creating of path
 * @param numberOfClusters number of cluster
 * @returns {[]} sorted array of addresses
 */
const sort = (numberOfClusters) => {

    const nodes = loadNodes();
    const start = startPoint(nodes);
    let lastPivot = 0;
    let lastNode = 0;
    //creating clusters
    const clusters = createClusters(nodes,numberOfClusters );

    //neighbours from pivots
    let clusterNodesVertices = [];
    clusterNodesVertices.push(start);
    let clusterMatrices = [];
    //create array with pivots of each cluster
    for (let k = 0; k < clusters.length; k++) {
        clusterNodesVertices.push(getPivot(start, clusters[k]));
        clusterMatrices[k] = [];
        clusterMatrices[k] = createMatrix(clusters[k]);
    }

    //create distance matrix with pivots and start point
    let clusterNeighbourMatrix = createMatrix(clusterNodesVertices);

    //computing of path
    let path = [];
    path.push(start);

    //selecting cluster from base matrix
    for (let i = 0; i < clusters.length; i++) {
        let nearestPivot = nearestIndex(clusterNeighbourMatrix[lastPivot], clusterNodesVertices, path);
        path.push(clusterNodesVertices[nearestPivot]);

        //cycle for computing path in clusters

        for (let j = 0; j < clusters[nearestPivot - 1].length; j++) {
            lastNode = pivotIndex(clusters[nearestPivot - 1], clusterNodesVertices[nearestPivot]);
            let nearestNode = nearestIndex(clusterMatrices[nearestPivot - 1][lastNode], clusters[nearestPivot - 1], path);
            if (nearestNode === -1) continue;
            if (nearestNode !== -2) {
                path.push(clusters[nearestPivot - 1][nearestNode]);
                lastNode = nearestNode;
            }
        }
        lastPivot = nearestPivot;
    }

    //add first point to create cycle
    path.push(start);
    return path;
};

/**
 * Get index of nearest point from row of matrix
 * @param lengthArr row of visited point
 * @param nodeArr array of points on row
 * @param path actual path
 * @returns {number} index of next point
 */
function nearestIndex(lengthArr, nodeArr, path) {

    let index = 0;
    let nearest = lengthArr[index];
    //fix for furthest nodes
    while (path.includes(nodeArr[index]) || nearest === null) {
        index++;
        nearest = lengthArr[index];
        if (nearest === undefined) return -1;
    }

    for (let i = 0; i < lengthArr.length; i++) {
        if (lengthArr[i] != null && lengthArr[i] < nearest && !path.includes(nodeArr[i]) && nodeArr[i].position !== 0) {
            index = i;
            nearest = lengthArr[i];
        }
    }
    if (path.includes(nodeArr[index])) return -2;


    return index;
}

/**
 *  Computing distance betwen two points in matrix - this part should be replaced by API call
 * @param destA first point
 * @param destB second point
 * @returns {number} length between points
 */
function getLength(destA, destB) {
    return distance(destA, destB);
}

/**
 * Creating matrix of length between points in cluster or base matrix with start point
 * @param vertices list of addresses
 * @returns {[]} matrix of length
 */
const createMatrix = (vertices) => {
    let outMatrix = [];

    for (let i = 0; i < vertices.length; i++) {
        outMatrix[i] = [];
        for (let j = 0; j < vertices.length; j++) {
            if (i === j) {
                outMatrix[i][j] = null;
            } else {
                outMatrix[i][j] = getLength(vertices[i], vertices[j]);
            }
        }
    }
    return outMatrix;
};
/**
 * Computing Euclid distances using GPS coordinates
 * @param centroid data of centroid
 * @param node data of node to compute
 * @returns {number} distance between points
 */
const distance = (centroid, node) => {
    let cent = centroid.gps.split(",");
    let nod = node.gps.split(",");
    let a = cent[0] - nod[0];
    let b = cent[1] - nod[1];
    return Math.abs(Math.sqrt(a * a + b * b));
};

/**
 * Creating clusters using k-means analyse
 * @param nodes input of addresses
 * @param k number of clusters
 * @returns {[]} array of clusters
 */
const createClusters = (nodes, k) => {
    if (k > nodes.length - 1 || k === undefined) k = 3;
    let clusters = [];
    let centroids = [];
    let oldCentroids = [];
    let change = false;

    //init clusters
    for (let i = 0; i < k; i++) {
        clusters[i] = [];
    }

    //select centroids
    let init = Math.round(nodes.length / (k + 1));

    for (let i = 0; i < k; i++) {
        centroids[i] = nodes[init * (i + 1)];
    }

    do {
        //empty clusters from previous step and reset change value
        for (let i = 0; i < k; i++) {
            clusters[i] = [];
        }
        change = false;
        let newClusterIndex = 0;
        //create clusters
        for (let i = 0; i < nodes.length; i++) {
            //dont add start node to clusters
            if (nodes[i].position === 0) continue;
            let oldDist = -1.0;
            let range;
            for (let j = 0; j < k; j++) {
                range = distance(centroids[j], nodes[i]);

                if (oldDist === -1.0) {
                    oldDist = range;
                    newClusterIndex = j;
                } else if (range <= oldDist) {
                    oldDist = range;
                    newClusterIndex = j;
                }
            }

            clusters[newClusterIndex].push(nodes[i]);
        }

        oldCentroids = centroids;
        let newCentroidIndex = 0;
        for (let i = 0; i < k; i++) {
            newCentroidIndex = clusters[i].length / clusters[newClusterIndex].length;
            centroids[i] = newCentroidIndex;
        }

        //check for same choose of centroids
        for (let i = 0; i < k; i++) {
            if (centroids[i] !== oldCentroids[i]) change = true;
        }
    } while (change);

    return clusters;
};

module.exports = {
    listNodes: listNodes,
    sort: sort,
};
