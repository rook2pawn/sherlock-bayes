function chooseRandom(pArray){ // chooses a random element given a probability distribution array
	var rand=Math.random()
	var sum=0
	var i=0
	while (rand>sum) {
		sum+=pArray[i]
		if (i===pArray.length-1){sum+=1}
		i++
	}
	return i-1
}
exports.chooseRandom = chooseRandom;

function makeEvidenceChart(priors,n){
	var evidenceChart=[]
	var culprit=chooseRandom(priors)
	for (var suspect=0;suspect<priors.length;suspect++) {
		var suspectArray=[]
		if (suspect===culprit) {
			for (var i=0;i<n;i++){
				suspectArray.push(true)
			}
		} else {
			var falseCount=0
			for (var i=0;i<n;i++){
				if (Math.random()<P_FALSELY){
					suspectArray.push(true)
				} else {
					suspectArray.push(false)
					falseCount++
				}
			}
			if (falseCount===0) {
				suspectArray[Math.floor(Math.random()*n)]=false
			}
		}
		evidenceChart.push(suspectArray)
	}
	evidenceChart.culprit=culprit
	evidenceChart.query=function(suspect,category,accuracy){
		var suspicion=evidenceChart[suspect][category]
		if (Math.random()<accuracy) {
			return suspicion
		} else {
			return !suspicion
		}
	}
	return evidenceChart
}
exports.makeEvidenceChart = makeEvidenceChart;

function generateDist(){
	var randArray=[]
	var sum=0
	for (var i=0;i<4;i++){
		var rand=Math.random()*0.65+0.35
		randArray.push(rand)
		sum+=rand
	}
	var partialSum=0
	for (var i=0;i<randArray.length-1;i++){
		randArray[i]/=sum
		partialSum+=randArray[i]
	}
	randArray[randArray.length-1]=1-partialSum
	return randArray
}
exports.generateDist = generateDist;


function makeChartUI(chart,x,y){
	var chartUI=[]
	for (var i=0;i<chart.length;i++) {
		var column=[]
		for (var j=0;j<chart[0].length;j++) {
			var div=document.createElement("DIV")
			div.style.backgroundColor="khaki"//rgb(250,250,100)"
			div.style.position="absolute"
			div.style.height=54
			div.style.width=109
			div.style.top=j*(parseInt(div.style.height)+1)+y
			div.style.left=i*(parseInt(div.style.width)+1)+x
			div.style.textAlign="center"
			//div.innerHTML=chart[i][j]
			div.prevQ=[] // new thing. keeps track of previous queries.
			div.suspect=i
			div.category=j
			div.onclick=function(){
				processClick(this.suspect,this.category,chart,chartUI,pDist)
			}
			postBody.appendChild(div)
			column.push(div)
		}
		chartUI.push(column)
	}
	return chartUI
}
exports.makeChartUI = makeChartUI;

function makeSpan(q,i,width,height) {
	var index
	switch (i%9) {
		case 0:
			index=4
			break
		case 1:
			index=6
			break
		case 2:
			index=2
			break
		case 3:
			index=0
			break
		case 4:
			index=8
			break
		case 5:
			index=3
			break
		case 6:
			index=5
			break
		case 7:
			index=7
			break
		case 8:
			index=1
			break
	}
	var text=document.createElement("SPAN")
	var percent=Math.round(q.accuracy*100)
	text.innerHTML=percent+"%"
	if (q.result) {
		text.style.color="red"
	} else {
		text.style.color="darkgreen"
	}
	text.style.position="absolute"
	//text.style.backgroundColor="yellow"
	if (text.innerHTML.length>3) {text.style.fontSize="12px"} else {text.style.fontSize="14px"}
	//text.style.fontWeight="bold"
	text.style.left=Math.floor(index/3)*width+width*0.08
	text.style.top=index%3*height
	console.log(i,index,text.style.left,text.style.top,width,height)
	return text
}
exports.makeChartUI = makeChartUI;

function processClick(suspect,category,chart,chartUI,pDist){
	//console.log("before",pDist)
	var cost=10
	var acccuracy
	//var accuracy=Math.random()*0.5+0.5 //maybe make accuracy based on category
	switch (category) {
		case 0:
			accuracy=0.85+0.15*2*(Math.random()-0.5)
			cost+=5
			//forensics: high accuracy, high cost
			break
		case 1:
			accuracy=0.75+0.15*2*(Math.random()-0.5)
			cost+=Math.round((Math.random()-0.5)*5)
			//motive: variable cost
			break
		case 2:
			accuracy=0.75+0.15*2*(Math.random()-0.5)
			cost+=0
			//alibi: standard cost and accuracy
			break
		case 3:
			accuracy=0.65+0.15*2*(Math.random()-0.5)
			cost-=5
			//character witnesses: low accuracy, low cost
			break
		case 4:
			accuracy=0.75+0.25*2*(Math.random()-0.5)
			cost+=0
			//eyewitnesses: highly variable accuracy
			break
	}
	//if (Math.random()<0.3) {accuracy=1}
	//accuracy=1
	//console.log(cost)
	var result=chart.query(suspect,category,accuracy)
	var q={result:result, suspect:suspect, category:category, accuracy:accuracy}
	var post=bayesTheorem(q,pDist,chartUI)
	for (var i=0;i<post.length;i++){
		pDist[i]=post[i]
	}
	pBars.update(pDist)
	pDistReport.update(pDist)
	//var pTrue=accuracy
	//if (!result) {pTrue=1-pTrue}
	var box=chartUI[suspect][category]
	box.innerHTML=""
	//if (box.prevQ.length>9) {box.prevQ.shift()}
	for (var i=box.prevQ.length-1;i>=0;i--){
		if (i===box.prevQ.length-10){break}
		var reportQ=makeSpan(box.prevQ[i],i,parseInt(box.style.width)/3,parseInt(box.style.height)/3)
		box.appendChild(reportQ)
		if (i===box.prevQ.length-1) {
			$(reportQ).animate({fontSize:"+=4", left:"-=2"},"fast").animate({fontSize:"-=4",left:"+=2"},"fast")
		}
	}
	

	//chartUI[suspect][category].innerHTML=result+"<br>"+Math.round(accuracy*100)+"%"
	//console.log("after",pDist)
}
exports.processClick = processClick;

function reveal(chart,chartUI){
	for (var i=0;i<chartUI.length;i++){
		for (var j=0;j<chartUI[0].length;j++){
			if (chart[i][j]) {
				chartUI[i][j].style.backgroundColor="pink"
			} else {
				chartUI[i][j].style.backgroundColor="lightgreen"
			}
		}
	}
}
exports.reveal = reveal;



function pFalseSuspicion(q,chartUI){ // the probability of having "true" even if innocent, takes previous q into account
	var prob=P_FALSELY-Math.pow(P_FALSELY,NUM_CATEGORIES)/NUM_CATEGORIES
	var qList=chartUI[q.suspect][q.category].prevQ
	for (var i=0;i<qList.length;i++){
		var likelihood=qList[i].accuracy
		if (!qList[i].result) {likelihood=1-likelihood}
		prob=prob*likelihood/(prob*likelihood+(1-prob)*(1-likelihood))
	}
	return prob
}
exports.pFalseSuspicion = pFalseSuspicion;
	
function likelihood(q,suspect,chartUI) { //P(qResult for qSuspect|suspect)
	if (suspect===q.suspect) {
		if (q.result){return q.accuracy}
		else {return 1-q.accuracy}
	} else {
		var pFalsely=pFalseSuspicion(q,chartUI)
		var pTrue=pFalsely*q.accuracy+(1-pFalsely)*(1-q.accuracy)
		if (q.result){return pTrue}
		else {return 1-pTrue}
	}
}
exports.likelihood = likelihood;

function denominator(q,priors,chartUI){ //P(result)
	var prob=0
	for (var i=0;i<priors.length;i++){
		prob+=priors[i]*likelihood(q,i,chartUI)
	}
	return prob
}
exports.denominator = denominator;

function bayesTheorem(q,priors,chartUI){
	var posteriors=[]
	var denom=denominator(q,priors,chartUI)
	for (var i=0;i<priors.length;i++){
		var prob=priors[i]*likelihood(q,i,chartUI)/denom
		posteriors.push(prob)
	}
	chartUI[q.suspect][q.category].prevQ.push(q)
	return posteriors
}

exports.bayesTheorem = bayesTheorem;


function makePBars(pDist,width,x,y){ //array of array of divs
	var pBars=[]
	pBars.spacing=width
	for (var i=0;i<pDist.length;i++){
		var div=document.createElement("DIV")
		div.style.backgroundColor="rgb(120,120,250)"
		div.style.position="absolute"
		div.style.height=Math.round(pDist[i]*100)
		div.style.width=10
		div.style.bottomCoord=y // new thing, indicates the bottom of the bar
		div.style.top=div.style.bottomCoord-parseInt(div.style.height)
		div.style.left=i*pBars.spacing+x
		div.style.borderStyle="solid"
		div.style.borderWidth="1px"
		postBody.appendChild(div)
		pBars.push([div])
	}
	pBars.update=function(newDist){
		for (var i=0;i<pBars.length;i++){
			var oldBar=$(pBars[i][0]).clone()[0]
			postBody.appendChild(oldBar)
			oldBar.style.backgroundColor="rgba(210,210,250,0.7)"
			pBars[i].splice(1,0,oldBar)
			if (pBars[i].length>10){
				var toDelete=pBars[i].pop()
				$(toDelete).remove()
			}
			$(pBars[i][0]).animate({
				top:pBars[i][0].style.bottomCoord-Math.round(newDist[i]*100),
				height:Math.round(newDist[i]*100)
			},"slow")
			for (var j=1;j<pBars[i].length;j++){
				//var newBGColor="rgba(210,210,250,"+(0.8-j/10)+")"
				//console.log(newBGColor)
				$(pBars[i][j]).animate({
					left:"+="+(12-j),//i*pBars.spacing+20+j*11,
					opacity:"-=0.11",
					width:"-=1"
				})
			}
			//console.log(pBars[i])
			//oldBar.style.left=i*parseInt(oldBar.style.width)+40
			/*
			for (var k=0;k<pBars[i].length;k++){
				$(pBars[i][k]).animate({left:"-=1"},"slow")
			}*/
		}
	}
	return pBars
}
exports.makePBars = makePBars;

function reportPDist(pDist,width,x,y){
	pDistReport=[]
	for (var i=0;i<pDist.length;i++){
		var text=document.createElement("SPAN")
		text.innerHTML=Math.round(pDist[i]*100)+"%"
		text.style.position="absolute"
		text.style.width=width
		text.style.color="rgba(0,0,0,1)"
		text.style.left=width*i+x
		text.style.top=y
		postBody.appendChild(text)
		pDistReport.push([text])
	}
	pDistReport.update=function(pDist){
		for (var i=0;i<pDist.length;i++){
			if (pDistReport[i].length>=2){
				var toDelete=pDistReport[i].pop()
				$(toDelete).remove()
			}
			pDistReport[i].push($(pDistReport[i][0]).clone()[0])
			postBody.appendChild(pDistReport[i][1])
			//pDistReport[i][1].innerHTML="<="+pDistReport[i][1].innerHTML
			$(pDistReport[i][1]).animate({
				left:"+=39", 
				opacity:"-=0.3",
				fontSize:"-=5",
				top:"+=1"
			},"fast")//,function(){pDistReport[i][1].innerHTML="<-"+pDistReport[i][1].innerHTML})
			pDistReport[i][0].innerHTML=Math.round(pDist[i]*100)+"%"
			$(pDistReport[i][0]).animate({fontSize:"+=3"},"fast").animate({fontSize:"-=3"},"fast")
		}
	}
	return pDistReport
}
exports.reportPDist = reportPDist;

function makePortraits(n,width,x,y){
	var portraits=[]
	for (var i=0;i<n;i++){
		var face=document.createElement("IMG")
		face.src=i+".png"
		face.style.position="absolute"
		face.style.top=y
		face.style.left=(i*parseInt(width)+x)
		face.onclick=function(){accuse(this)}
		postBody.appendChild(face)
	}
	return portraits
}



function accuse(portrait){
	console.log(portrait.src)
	reveal(chart,chartUI)
}

function makePriorsBoxes(pDist,width,x,y) {
	var boxes=[]
	console.log(pDist,width,x,y)
	for (var i=0;i<pDist.length;i++){
		var div=document.createElement("DIV")
		div.style.width=width
		div.style.height=width/2
		div.style.position="absolute"
		div.style.top=y
		div.style.left=x+i*(width+1)
		div.style.textAlign="center"
		div.style.backgroundColor="yellow"
		div.innerHTML="Prior probability:</br>"+Math.round(pDist[i]*100)+"%"
		postBody.appendChild(div)
		boxes.push(div)
	}
	return boxes
}

var portraits=makePortraits(4,chartUI[0][0].style.width,225,185)
var priorBoxes=makePriorsBoxes(pDist,parseInt(chartUI[0][0].style.width),200,525)
var sherlockBayesPortrait=document.createElement("IMG")
sherlockBayesPortrait.src="sherlockBayes180.png"
sherlockBayesPortrait.style.position="absolute"
sherlockBayesPortrait.style.top=200
sherlockBayesPortrait.style.left=15
postBody.appendChild(sherlockBayesPortrait)
