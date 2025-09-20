// Physics system using Cannon.js for the 3D Ball Adventure game
class PhysicsSystem {
    constructor(scene) {
        this.scene = scene;
        if (typeof CANNON === 'undefined') {
            throw new Error('CANNON.js library is required but not loaded.');
        }

        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Earth's gravity
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        if (this.world.defaultContactMaterial) {
            this.world.defaultContactMaterial.friction = 0.5;
            this.world.defaultContactMaterial.restitution = 0.3;
        }

        this.fixedTimeStep = 1 / 60; // 60 Hz simulation
        this.maxSubSteps = 3;
        
        // Create materials
        this.groundMaterial = new CANNON.Material('ground');
        this.ballMaterial = new CANNON.Material('ball');
        
        // Create contact materials
        const ballGroundContactMaterial = new CANNON.ContactMaterial(
            this.groundMaterial,
            this.ballMaterial,
            {
                friction: 0.5,
                restitution: 0.3 // Bounce factor
            }
        );
        
        this.world.addContactMaterial(ballGroundContactMaterial);
        
        // Keep track of all bodies and meshes
        this.bodies = [];
        this.meshes = [];
        
        // Visual debug helpers
        this.debugMode = false;
        this.debugBodies = [];
    }
    
    update(deltaTime) {
        // Step the physics simulation
        this.world.step(this.fixedTimeStep, deltaTime, this.maxSubSteps);
        
        // Update meshes based on body positions
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const mesh = this.meshes[i];
            
            if (body && mesh) {
                mesh.position.copy(body.position);
                mesh.quaternion.copy(body.quaternion);
            }
        }
        
        // Update debug bodies if debug mode is enabled
        if (this.debugMode) {
            for (let i = 0; i < this.debugBodies.length; i++) {
                const helper = this.debugBodies[i].helper;
                const body = this.debugBodies[i].body;
                
                if (helper && body) {
                    helper.position.copy(body.position);
                    helper.quaternion.copy(body.quaternion);
                }
            }
        }
    }
    
    createGroundBody(geometry, position, quaternion, isStatic = true) {
        const shape = this.createShapeFromGeometry(geometry);
        
        const body = new CANNON.Body({
            mass: isStatic ? 0 : 1, // 0 = static body
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: this.groundMaterial
        });
        
        if (quaternion) {
            body.quaternion.copy(quaternion);
        }
        
        this.world.addBody(body);
        return body;
    }
    
    createSphereBody(radius, position, mass = 1) {
        const shape = new CANNON.Sphere(radius);
        
        const body = new CANNON.Body({
            mass: mass,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: this.ballMaterial,
            linearDamping: 0.3, // Add some resistance
            angularDamping: 0.3
        });
        
        this.world.addBody(body);
        return body;
    }
    
    createBoxBody(width, height, depth, position, quaternion, mass = 0) {
        const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        
        const body = new CANNON.Body({
            mass: mass,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: this.groundMaterial
        });
        
        if (quaternion) {
            body.quaternion.copy(quaternion);
        }
        
        this.world.addBody(body);
        return body;
    }
    
    createCylinderBody(radiusTop, radiusBottom, height, position, quaternion, mass = 0) {
        // Generate points for approximated cylinder
        const numSegments = 8;
        const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
        
        const body = new CANNON.Body({
            mass: mass,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: this.groundMaterial
        });
        
        // Rotate the cylinder to match Three.js orientation
        const quatX = new CANNON.Quaternion();
        quatX.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        body.quaternion.copy(quatX);
        
        if (quaternion) {
            body.quaternion.mult(quaternion, body.quaternion);
        }
        
        this.world.addBody(body);
        return body;
    }
    
    createShapeFromGeometry(geometry) {
        // This is a simplified implementation
        // For complex geometries, we would need more sophisticated conversion
        
        // Check if we have a box geometry
        if (geometry.type === 'BoxGeometry') {
            const params = geometry.parameters;
            return new CANNON.Box(new CANNON.Vec3(
                params.width / 2, 
                params.height / 2, 
                params.depth / 2
            ));
        }
        
        // For planes or other flat surfaces, we'll use a box with minimal height
        return new CANNON.Box(new CANNON.Vec3(
            geometry.parameters.width / 2 || 50,
            0.1, // Very thin
            geometry.parameters.height / 2 || 50
        ));
    }
    
    addBodyMeshPair(body, mesh) {
        this.bodies.push(body);
        this.meshes.push(mesh);
    }
    
    removeBodyMeshPair(body, mesh) {
        const bodyIndex = this.bodies.indexOf(body);
        if (bodyIndex !== -1) {
            this.bodies.splice(bodyIndex, 1);
            this.meshes.splice(bodyIndex, 1);
        }
        
        this.world.removeBody(body);
    }
    
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode) {
            this.createDebugBodies();
        } else {
            this.removeDebugBodies();
        }
    }
    
    createDebugBodies() {
        // Clear previous debug bodies
        this.removeDebugBodies();
        
        // Create a debug visualization for each physics body
        this.bodies.forEach(body => {
            if (body.shapes.length > 0) {
                const shape = body.shapes[0];
                let helper;
                
                if (shape instanceof CANNON.Box) {
                    const geometry = new THREE.BoxGeometry(
                        shape.halfExtents.x * 2,
                        shape.halfExtents.y * 2,
                        shape.halfExtents.z * 2
                    );
                    const material = new THREE.MeshBasicMaterial({ 
                        color: 0x00ff00, 
                        wireframe: true,
                        transparent: true,
                        opacity: 0.5
                    });
                    helper = new THREE.Mesh(geometry, material);
                } else if (shape instanceof CANNON.Sphere) {
                    const geometry = new THREE.SphereGeometry(shape.radius);
                    const material = new THREE.MeshBasicMaterial({ 
                        color: 0x00ff00, 
                        wireframe: true,
                        transparent: true,
                        opacity: 0.5
                    });
                    helper = new THREE.Mesh(geometry, material);
                } else if (shape instanceof CANNON.Cylinder) {
                    const geometry = new THREE.CylinderGeometry(
                        shape.radiusTop,
                        shape.radiusBottom,
                        shape.height,
                        16
                    );
                    const material = new THREE.MeshBasicMaterial({ 
                        color: 0x00ff00, 
                        wireframe: true,
                        transparent: true,
                        opacity: 0.5
                    });
                    helper = new THREE.Mesh(geometry, material);
                }
                
                if (helper) {
                    helper.position.copy(body.position);
                    helper.quaternion.copy(body.quaternion);
                    this.scene.add(helper);
                    this.debugBodies.push({ helper, body });
                }
            }
        });
    }
    
    removeDebugBodies() {
        this.debugBodies.forEach(debugBody => {
            if (debugBody.helper) {
                this.scene.remove(debugBody.helper);
            }
        });
        
        this.debugBodies = [];
    }
    
    applyImpulse(body, direction, strength) {
        const impulse = new CANNON.Vec3(
            direction.x * strength,
            direction.y * strength,
            direction.z * strength
        );
        body.applyImpulse(impulse, body.position);
    }
    
    applyForce(body, direction, strength) {
        const force = new CANNON.Vec3(
            direction.x * strength,
            direction.y * strength,
            direction.z * strength
        );
        body.applyForce(force, body.position);
    }
    
    // Check for collision between two bodies
    checkCollision(bodyA, bodyB) {
        const contacts = this.world.contacts;
        
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            
            if ((contact.bi === bodyA && contact.bj === bodyB) ||
                (contact.bi === bodyB && contact.bj === bodyA)) {
                return true;
            }
        }
        
        return false;
    }
    
    // Get the distance between two bodies
    getDistance(bodyA, bodyB) {
        return bodyA.position.distanceTo(bodyB.position);
    }
    
    // Clean up the physics system
    cleanup() {
        this.bodies.forEach(body => {
            this.world.removeBody(body);
        });
        
        this.bodies = [];
        this.meshes = [];
        this.removeDebugBodies();
    }
}