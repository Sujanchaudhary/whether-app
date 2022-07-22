import {Box,Button, Container, VStack, HStack, Input} from '@chakra-ui/react';
import Message from './component/Message';
import {onAuthStateChanged, getAuth, GoogleAuthProvider, signInWithPopup, signOut} from 'firebase/auth'
import {app} from './Firebase';
import { useEffect, useRef, useState } from 'react';
import { getFirestore, addDoc, collection, serverTimestamp, onSnapshot,query, orderBy } from 'firebase/firestore';


const auth = getAuth(app);
const db = getFirestore(app)

const loginHandler = ()=>{
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth,provider)
}
const logoutHandler = ()=>{
  signOut(auth);
}

function App() {
  const q = query(collection(db,'Messages'),orderBy('createdAt','asc'))
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages]= useState([]);

  const divforscroll = useRef(null);

  const submitHandler = async(e)=>{
    e.preventDefault()
    try {
      setMessage('');
      await addDoc(collection(db, "Messages"), {
        text: message,
        uid:user.uid,
        uri: user.photoURL,
        createdAt: serverTimestamp()
      })
      
      divforscroll.current.scrollIntoView({behavior: 'smooth'});
    } catch (error) {
      alert(error)
    }
  } 
  useEffect(() =>{
   const unsubscribe = onAuthStateChanged(auth, (data)=>{
      setUser(data);
    });
    const unsubscribeformessage = onSnapshot(q,(snap)=>{
       setMessages(snap.docs.map((item)=>{
        const id = item.id;
        return {id, ...item.data()};
       }));
    })
    return ()=>{
      unsubscribe();
      unsubscribeformessage();

    }
  },[]);

  return (
   <Box bg={'red.50'}>
    {
      user?(
        <Container h={'100vh'} bg={'white'}>
      <VStack h='full' padding={"4"}>
        <Button colorScheme={'red'} w={'full'} onClick={logoutHandler}>
          Logout
        </Button>
        <VStack h='full' w={'full'} overflowY='auto' css={{'&::-webkit-scrollbar':{
          display: 'none'
        }}}>
          {
            messages.map(item=>(
              <Message 
              key={item.id}
              user={item.uid===user.uid? 'me': 'other'} 
              text={item.text} 
              uri={item.uri}/>
            ))}

          <div ref={divforscroll}></div>
        </VStack>
        
          <form onSubmit={submitHandler} style={{width: '100%'}}>
            <HStack>
            <Input value={message} onChange={(e)=>{
              setMessage(e.target.value)
            }} placeholder='Enter a message...' />
            <Button colorScheme={'purple'} type='submit'>Send</Button>
            </HStack>
          </form>
      </VStack>
    </Container>
      ):<VStack justifyContent={'center'} h='100vh'>
        <Button onClick={loginHandler} colorScheme={'purple'}>
          Sign in with google
        </Button>
      </VStack>
    }
   </Box>
  );
}

export default App;
