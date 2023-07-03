import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import CANNON from 'cannon'

THREE.ColorManagement.enabled = false

/**
 * Debug
 */
const gui = new dat.GUI()



const debugObj= {}
debugObj.createSphere = () =>{
    createSphere(Math.random()*0.5,{
        x:(Math.random()-.5)*3,
        y:3,
        z:(Math.random()-.5)*3
    })
}
debugObj.createBox = () =>{
    createBox(
        Math.random(),
        Math.random(),
        Math.random(),
        {
        x:(Math.random()-.5)*3,
        y:3,
        z:(Math.random()-.5)*3
    })
}

debugObj.createDIAG = () =>{
    spiralLoopSpheres()
}

debugObj.reset = () => {

    for(const object of objectsToUpdate){
        object.body.removeEventListener('collide', playHitSound)
        world.removeBody(object.body)
        scene.remove(object.mesh)
    }
    objectsToUpdate.splice(0,objectsToUpdate.length)
    
}

gui.add(debugObj, 'createSphere')
gui.add(debugObj, 'createBox')
gui.add(debugObj, 'createDIAG')
gui.add(debugObj, 'reset')

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

//sounds

const hitSound = new Audio('/sounds/hit.mp3')
const playHitSound = (collision) =>{
    if(collision.contact.getImpactVelocityAlongNormal()>1){
        let volMax = Math.min(collision.contact.getImpactVelocityAlongNormal(),10)/10
        hitSound.volume= volMax
        hitSound.currentTime=0
        hitSound.play() 
    }
    
    
}

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])


/**
 *  Physics
 */

const world = new CANNON.World()
world.gravity.set(0,-9.82,0)
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true


//materials

const defaultMaterial = new CANNON.Material('defaultMaterial')

const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction:.1,
        restitution:.8
    }
)
world.addContactMaterial(defaultContactMaterial)
world.defaultContactMaterial = defaultMaterial 







// //sphere
// const sphereShape = new CANNON.Sphere(0.5)
// const sphereBody = new CANNON.Body({
//     mass:1,
//     position: new CANNON.Vec3(0,3,0),
//     shape: sphereShape,
//     material:defaultMaterial
// }) 
// world.addBody(sphereBody)

// sphereBody.applyLocalForce(new CANNON.Vec3(150,0,0),new CANNON.Vec3(0,0,0) )


//floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.material = defaultMaterial
floorBody.mass = 0
floorBody.addShape(floorShape)
floorBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(1,0,0),
    -Math.PI*0.5
)
world.addBody(floorBody)

/**
 * Test sphere
 */
// const sphere = new THREE.Mesh(
//     new THREE.SphereGeometry(0.5, 32, 32),
//     new THREE.MeshStandardMaterial({
//         metalness: 0.3,
//         roughness: 0.4,
//         envMap: environmentMapTexture,
//         envMapIntensity: 0.5
//     })
// )
// sphere.castShadow = true
// sphere.position.y = 0.5


// scene.add(sphere)



/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0,
        roughness: 0,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
// const dhelp = new THREE.DirectionalLightHelper(directionalLight)
// scene.add(dhelp)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 35
directionalLight.shadow.camera.left = - 24
directionalLight.shadow.camera.top = 14
directionalLight.shadow.camera.right = 24
directionalLight.shadow.camera.bottom = - 14
directionalLight.position.set(8, 8, 8)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-8, 12, 8)
scene.add(camera)

const axesHelper = new THREE.AxesHelper()
// scene.add(axesHelper)


// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.outputColorSpace = THREE.LinearSRGBColorSpace
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


/**
 * Utils
 */

const objectsToUpdate = []


const sphereGEO = new THREE.SphereGeometry(1, 20, 20)
const boxGEO = new THREE.BoxGeometry(1,1,1)

const sphereMAT = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture,
    envMapIntensity: 0.5
})



const createBox = (w,h,d, position)=>{

    // create the mesh
    const mesh = new THREE.Mesh(boxGEO,sphereMAT)
    mesh.scale.set(w,h,d)
    mesh.position.copy(position)
    mesh.castShadow = true
    scene.add(mesh)

    //create the body
    const boxShape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2))
    const boxBody = new CANNON.Body({
        mass:1,
        position: new CANNON.Vec3(0,3,0),
        shape: boxShape,
        material:defaultMaterial
    })
    boxBody.position.copy(position)
    world.addBody(boxBody)

    boxBody.addEventListener('collide',playHitSound)


    objectsToUpdate.push({
        mesh:mesh,
        body:boxBody
    })

}




const createSphere = (radius, position) =>{

    const mesh = new THREE.Mesh(
        sphereGEO,
        sphereMAT
    )
    mesh.scale.set(radius,radius,radius)
    mesh.castShadow = true
    mesh.position.copy(position)
    // console.log(mesh.position)
    scene.add(mesh)

    const sphereShape = new CANNON.Sphere(radius)
    const sphereBody = new CANNON.Body({
        mass:1,
        position: new CANNON.Vec3(0,3,0),
        shape: sphereShape,
        material:defaultMaterial
    }) 
    sphereBody.position.copy(position)
    // console.log(mesh.position)
    world.addBody(sphereBody)

    sphereBody.addEventListener('collide',playHitSound)


    objectsToUpdate.push({
        mesh:mesh,
        body:sphereBody
    })
}


const spiralLoopSpheres =()=> {
    let xMax =10
    let yMax =10
    let xi = 0;
    let yi = 0;
    let dx = 0;
    let dy = -1;
  
    for (let i = 0; i < Math.max(xMax, yMax) ** 2; i++) {
      if (-xMax / 2 <= xi && xi <= xMax / 2 && -yMax / 2 <= yi && yi <= yMax / 2) {
        createSphere(.4,{x:xi-.5,y:2+i*.1,z:yi-.5})

      }
  
      if (xi === yi || (xi < 0 && xi === -yi) || (xi > 0 && xi === 1 - yi)) {
        let temp = dx;
        dx = -dy;
        dy = temp;
      }
  
      xi += dx;
      yi += dy;
    }
  }
  
const inline = ()=>{
    for(let i=0;i<10;i++){
        //for(let j=0;j<10;j++){
            createSphere(.4,{x:i-4.5,y:1+i,z:0})
        //}
    }
}
//  inline()

// createSphere(.4,{x:1,y:1,z:1})


// spiralLoopSpheres();
// [1],[4],[6]
// 2,5,7
// 4,7,9



// createSphere(.5,{xi:0,yi:3,z:0})

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime=elapsedTime

    //update physics world
    world.step(1/160,deltaTime,3)


    // for(const object of objectsToUpdate){
    //     object.mesh.position.copy(object.body.position)
    // }
    for(let i = 0;i< objectsToUpdate.length;i++){
        // if(i>=90){
            // console.log(i)
            // console.log(objectsToUpdate[i].body.velocity)
        // }
        objectsToUpdate[i].mesh.position.copy(objectsToUpdate[i].body.position)
        objectsToUpdate[i].mesh.quaternion.copy(objectsToUpdate[i].body.quaternion)
    }


    // sphereBody.applyForce(new CANNON.Vec3(-0.5,0,0), sphereBody.position)

    //apply physics world to three js
    // sphere.position.copy(sphereBody.position)

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()